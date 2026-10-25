import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { activityStoredTrace } from '../../types/activity.types';
import { subagentAgents } from '../subagent/subagent.constants';
import { ACTIVITY } from './activity.constants';
import { activityEntryTitle, activityFetch, activityGroups, activityIsLive, activityLiveTasks, activityLiveWaits, activityNames, activityRunBuild, activityToolInputs } from './activity.utils';
import type { ActivityContextParams, ActivityRunParams, ActivityServiceDeps } from '../../types/activity.types';
import type { ConversationId } from '@earendil-works/pi-durable';
import type { ActivityRun } from '@repo/contracts/universal';

export async function activityQueryRun(
  deps: ActivityServiceDeps,
  { conversationId, runId, context }: ActivityRunParams & ActivityContextParams,
): Promise<ActivityRun> {
  const tasks = await activityLiveWaits(deps, await activityLiveTasks(deps, context), context);

  const root = match(await deps.telemetry.getTrace(runId))
    .with({ spans: [P._, ...P.array()] }, (trace) => activityStoredTrace.parse(trace))
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'run', resourceId: runId });
    });

  const startedMs = Math.min(...root.spans.map((span) => span.startedMs));

  const { traces } = await activityFetch({
    telemetry: deps.telemetry,
    query: { startMin: Math.floor(startedMs), startMax: Math.ceil(startedMs + ACTIVITY.runWindowMs) },
    isEnough: () => false,
  });

  const groups = activityGroups(traces.some((trace) => trace.traceId === runId) ? traces : [...traces, root], conversationId);
  const index = groups.findIndex((item) => item.root.trace.traceId === runId);

  const group = match(groups[index])
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'run', resourceId: runId });
    });

  const lanes = [...new Set(group.traces.flatMap((info) => (info.conversationId === null ? [] : [info.conversationId])))];

  const agents = await Promise.all(lanes.map(async (lane) => {
    // SAFETY: lane IDs come from this store's own submission telemetry and are only used as lookup keys.
    const id = lane as ConversationId;
    return (await deps.harness.snapshot(subagentAgents, id, context))?.agents;
  }));

  return activityRunBuild({
    group,
    title: await activityEntryTitle(deps, group.root, context),
    names: activityNames(agents),
    liveTasks: tasks,
    inputs: await activityToolInputs(deps, group, context),
    isLive: activityIsLive(group, index === 0, tasks),
  });
}
