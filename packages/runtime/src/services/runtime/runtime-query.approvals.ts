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
  const conversation = await runtimeQueryConversation(deps, params, context);
  const graph = await deps.harness.taskGraph(context);

  try {
    const tasks = Object.values(graph.value.tasks).filter((task) => (
      task.conversationId === conversation.id && task.kind === 'pi.tool' && !task.abortRequested
    ));

    const documents = await Promise.all(
      tasks.map((task) => deps.harness.snapshot(runtimeToolApproval, task.id, context)),
    );

    return documents.flatMap((doc) => (
      match(doc?.approval)
        .with({ status: 'pending', expiresAt: P.number.gt(Date.now()) }, (approval) => [approval])
        .otherwise(() => [])
    ));
  } finally {
    graph.dispose();
  }
}
