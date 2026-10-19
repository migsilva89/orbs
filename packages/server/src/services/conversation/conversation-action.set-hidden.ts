import { conversationQueryPreferences } from './conversation-query.preferences';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetHiddenInput } from '@openbots/contracts/universal';

export async function conversationActionSetHidden(deps: ConversationServiceDeps, { botId, isHidden }: ConversationSetHiddenInput) {
  return conversationQueryPreferences(deps, { botId, preference: await deps.bots.actions.setPreferences({ botId, isHidden }) });
}
