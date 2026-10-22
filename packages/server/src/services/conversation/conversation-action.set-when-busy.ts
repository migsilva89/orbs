import { conversationQueryPreferences } from './conversation-query.preferences';
import type { ConversationServiceDeps } from '../../types/conversation.types';
import type { ConversationSetWhenBusyInput } from '@repo/contracts/universal';

export async function conversationActionSetWhenBusy(deps: ConversationServiceDeps, { botId, whenBusy }: ConversationSetWhenBusyInput) {
  return conversationQueryPreferences(deps, { botId, preference: await deps.bots.actions.setPreferences({ botId, whenBusy }) });
}
