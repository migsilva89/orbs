import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetHiddenInput } from '@openbots/contracts/universal';

export async function conversationActionSetHidden({ runtime, bots }: ConversationServiceDeps, params: ConversationSetHiddenInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.setHidden(params);
}
