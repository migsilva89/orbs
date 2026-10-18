import { conversationListItems } from './conversation.utils';
import type { ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationQueryList({ bots, runtime }: ConversationServiceDeps) {
  const [botList, conversations] = await Promise.all([
    bots.queries.list(),
    runtime.queries.conversations(),
  ]);

  return conversationListItems(botList, conversations);
}
