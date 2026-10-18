import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetMutedInput } from '@openbots/contracts/universal';

export async function conversationActionSetMuted({ runtime, bots }: ConversationServiceDeps, params: ConversationSetMutedInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.setMuted(params);
}
