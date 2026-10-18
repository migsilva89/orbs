import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationReactionsInput } from '@openbots/contracts/universal';

export async function conversationQueryReactions({ runtime, bots }: ConversationServiceDeps, params: ConversationReactionsInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.reactions(params);
}
