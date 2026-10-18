import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryQuestions(deps: RuntimeServiceDeps, params: RuntimeConversationParams, context: Context) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  const questions = await deps.questions.queries.pending({ conversationId: conversation.id }, context);

  return questions.map((question) => ({ ...question, botId: params.botId }));
}
