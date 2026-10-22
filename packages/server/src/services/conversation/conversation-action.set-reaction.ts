import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetReactionInput } from '@repo/contracts/universal';

export async function conversationActionSetReaction({ runtime, bots }: ConversationServiceDeps, params: ConversationSetReactionInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.setReaction(params);
}
