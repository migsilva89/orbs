import type { ConversationAnswerQuestionParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationActionAnswerQuestion(
  { runtime, bots }: ConversationServiceDeps,
  params: ConversationAnswerQuestionParams,
) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.answerQuestion(params);
}
