import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationMarkReadInput } from '@openbots/contracts/universal';

export async function conversationActionMarkRead({ runtime, bots }: ConversationServiceDeps, params: ConversationMarkReadInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.markRead(params);
}
