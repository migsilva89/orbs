import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationArrangeInput } from '@repo/contracts/universal';

export async function conversationActionArrange({ bots }: ConversationServiceDeps, params: ConversationArrangeInput) {
  await bots.actions.arrange(params);
}
