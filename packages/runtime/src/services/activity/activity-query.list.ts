import { match } from 'ts-pattern';
import { ACTIVITY } from './activity.constants';
import { activityEntryTitle, activityFetch, activityGroups, activityIsLive, activityLiveTasks, activityRunBuild } from './activity.utils';
import type { ActivityContextParams, ActivityListParams, ActivityServiceDeps } from '../../types/activity.types';
import type { ActivityPage } from '@repo/contracts/universal';

export async function activityQueryList(
  deps: ActivityServiceDeps,
  { conversationId, before, context }: ActivityListParams & ActivityContextParams,
): Promise<ActivityPage> {
  const tasks = await activityLiveTasks(deps, context);

  const { traces, hasMore } = await activityFetch({
    telemetry: deps.telemetry,
    query: { startMax: before === undefined ? undefined : before - 1 },
    isEnough: (found) => activityGroups(found, conversationId).length > ACTIVITY.pageSize,
  });

  const later = await match(before)
    .with(undefined, async () => [])
    .otherwise(async (value) => (await activityFetch({
      telemetry: deps.telemetry,
      query: { startMin: value, startMax: value + ACTIVITY.runWindowMs },
      isEnough: () => false,
    })).traces);

  const groups = activityGroups(traces, conversationId);

  const page = activityGroups([...traces, ...later], conversationId)
    .filter((group) => before === undefined || group.root.root.startedMs < before)
    .slice(0, ACTIVITY.pageSize);

  const runs = await Promise.all(page.map(async (group, index) => {
    const { agents: _agents, spans: _spans, handoffs: _handoffs, ...summary } = activityRunBuild({
      group,
      title: await activityEntryTitle(deps, group.root, context),
      names: new Map(),
      liveTasks: [],
      inputs: new Map(),
      isLive: activityIsLive(group, before === undefined && index === 0, tasks),
    });

    return summary;
  }));

  const oldest = page.at(-1);
  const isMore = groups.length > page.length || hasMore;

  return {
    runs,
    nextBefore: isMore && oldest ? Math.floor(oldest.root.root.startedMs) : null,
  };
}
