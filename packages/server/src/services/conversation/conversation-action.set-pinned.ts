import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetPinnedInput } from '@openbots/contracts/universal';

export async function conversationActionSetPinned({ runtime, bots }: ConversationServiceDeps, params: ConversationSetPinnedInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.setPinned(params);
}
