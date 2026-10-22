import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSearchInput } from '@repo/contracts/universal';

export async function conversationQuerySearch({ runtime, bots }: ConversationServiceDeps, params: ConversationSearchInput) {
  await bots.queries.get({ botId: params.botId });

  return runtime.queries.search(params);
}
