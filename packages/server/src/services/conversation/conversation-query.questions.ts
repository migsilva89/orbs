import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationTarget } from '@openbots/contracts/universal';

export async function conversationQueryQuestions({ runtime, bots }: ConversationServiceDeps, params: ConversationTarget) {
  await bots.queries.get(params);
  return runtime.queries.questions(params);
}
