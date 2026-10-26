import { runtimeContextPrivateWith } from './runtime-context.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBotConversations } from './runtime.constants';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeQueryQuestions(deps: RuntimeServiceDeps, params: RuntimeConversationParams & RuntimeContextInput) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);
  const binding = await deps.harness.snapshot(runtimeBotConversations, params.botId, context);
  const privateIds = binding?.conversationId === conversation.id ? await runtimeQueryPrivateConversations() : [];

  const lists = await Promise.all([conversation.id, ...privateIds].map((conversationId) => (
    deps.questions.queries.pending({ conversationId }, context)
  )));

  return Promise.all(lists.flat().map(async (question) => ({
    ...question,
    botId: params.botId,
    privateWith: await runtimeContextPrivateWith(deps, params.botId, question.conversationId, context),
  })));

  async function runtimeQueryPrivateConversations() {
    const graph = await deps.harness.taskGraph(context);

    try {
      const ids = [...new Set(Object.values(graph.value.tasks)
        .filter((task) => task.kind === 'pi.tool' && !task.abortRequested && task.conversationId !== conversation.id)
        .map((task) => task.conversationId))];

      const owners = await Promise.all(ids.map(async (id) => ({ id, privateWith: await runtimeContextPrivateWith(deps, params.botId, id, context) })));

      return owners.flatMap(({ id, privateWith }) => (privateWith ? [id] : []));
    } finally {
      graph.dispose();
    }
  }
}
