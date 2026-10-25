import { match, P } from 'ts-pattern';
import { questionDocument } from '../question/question.constants';
import { routineDocument } from '../routine/routine.constants';
import { routineTask } from '../routine/routine.task';
import { subagentAnchor } from '../subagent/subagent-anchor.task';
import { RUNTIME_ALARM_HEARTBEAT_MS, runtimeBotConversations, runtimeToolApproval } from './runtime.constants';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryNextDeadline({ harness, botId }: RuntimeServiceDeps, context: Context) {
  const now = Date.now();
  const binding = await harness.snapshot(runtimeBotConversations, botId, context);

  const routines = await match(binding?.conversationId)
    .with(P.nonNullable, (id) => harness.snapshot(routineDocument, id, context))
    .otherwise(() => undefined);

  const graph = await harness.taskGraph(context);

  try {
    const tasks = Object.values(graph.value.tasks).filter((task) => !task.abortRequested);
    const tools = tasks.filter((task) => task.kind === 'pi.tool');

    const waits = await Promise.all(tools.map(async (task) => [
      (await harness.snapshot(runtimeToolApproval, task.id, context))?.approval,
      (await harness.snapshot(questionDocument, task.id, context))?.question,
    ]));

    const isLive = tasks.some((task) => task.kind !== routineTask.definition.name && task.kind !== subagentAnchor.definition.name);

    const deadlines = [
      ...Object.values(routines?.routines ?? {}).flatMap((routine) => match(routine)
        .with({ isEnabled: true, nextRunAt: P.number }, ({ nextRunAt }) => [nextRunAt])
        .otherwise(() => [])),
      ...waits.flat().flatMap((wait) => match(wait)
        .with({ status: 'pending', expiresAt: P.number }, ({ expiresAt }) => [expiresAt])
        .otherwise(() => [])),
      ...match(isLive).with(true, () => [now + RUNTIME_ALARM_HEARTBEAT_MS]).with(false, () => []).exhaustive(),
    ];

    return match(deadlines)
      .with([], () => null)
      .otherwise((values) => Math.max(now, Math.min(...values)));
  } finally {
    graph.dispose();
  }
}
