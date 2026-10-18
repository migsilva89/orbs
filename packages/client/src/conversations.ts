import { applyImmutable } from '@earendil-works/chord/delta';
import type { Client } from './types/client.types';
import type { ConversationListItem } from '@openbots/contracts/universal';

export async function* watchConversations(client: Client, signal: AbortSignal) {
  const frames = await client.conversation.watchList(undefined, { signal });
  let conversations: ConversationListItem[] | undefined;

  for await (const ops of frames) {
    conversations = applyImmutable<ConversationListItem[]>(conversations, ops);
    yield conversations;
  }
}
