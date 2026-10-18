import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeToolApproval } from './runtime.constants';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryApprovals(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams,
  context: Context,
) {
  await runtimeQueryConversation(deps, { botId: params.botId }, context);
  const graph = await deps.harness.taskGraph(context);

  try {
    const tasks = Object.values(graph.value.tasks).filter((task) => (
      task.kind === 'pi.tool' && !task.abortRequested
    ));

    const documents = await Promise.all(
      tasks.map(async (task) => ({
        conversationId: task.conversationId,
        document: await deps.harness.snapshot(runtimeToolApproval, task.id, context),
      })),
    );

    return documents.flatMap(({ document, conversationId }) => (
      match(document?.approval)
        .with({
          botId: params.botId,
          status: 'pending',
          expiresAt: P.number.gt(Date.now()),
        }, (approval) => [{ ...approval, conversationId }])
        .otherwise(() => [])
    ));
  } finally {
    graph.dispose();
  }
}
