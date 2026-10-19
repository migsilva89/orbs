import { conversationListItems, conversationSummaries } from './conversation.utils';
import type { ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationQueryList({ bots, runtime }: ConversationServiceDeps) {
  const [botList, preferences, summaries] = await Promise.all([
    bots.queries.list(),
    bots.queries.preferences(),
    runtime.queries.conversations(),
  ]);

  return conversationListItems(botList, conversationSummaries(summaries, preferences));
}
