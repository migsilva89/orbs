import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeQueryQuestions(deps: RuntimeServiceDeps, params: RuntimeConversationParams & RuntimeContextInput) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);
  const questions = await deps.questions.queries.pending({ conversationId: conversation.id }, context);

  return questions.map((question) => ({ ...question, botId: params.botId }));
}
