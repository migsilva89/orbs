import { conversationPreferencesView } from './conversation.utils';
import type { ConversationPreferencesParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationQueryPreferences({ runtime }: ConversationServiceDeps, { botId, preference }: ConversationPreferencesParams) {
  const summaries = await runtime.queries.conversations();
  const summary = summaries.find((item) => item.botId === botId);

  return conversationPreferencesView(preference, summary?.lastAssistantEntryId ?? 0);
}
