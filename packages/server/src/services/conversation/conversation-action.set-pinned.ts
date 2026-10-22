import { conversationQueryPreferences } from './conversation-query.preferences';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetPinnedInput } from '@repo/contracts/universal';

export async function conversationActionSetPinned(deps: ConversationServiceDeps, { botId, isPinned }: ConversationSetPinnedInput) {
  return conversationQueryPreferences(deps, { botId, preference: await deps.bots.actions.setPreferences({ botId, isPinned }) });
}
