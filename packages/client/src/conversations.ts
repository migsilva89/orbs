import { applyImmutable } from '@earendil-works/chord/delta';
import type { Client } from './types/client.types';
import type { ConversationListState } from '@repo/contracts/universal';

export async function* watchConversations(client: Client, signal: AbortSignal) {
  const frames = await client.conversation.watchList(undefined, { signal });
  let state: ConversationListState | undefined;

  for await (const ops of frames) {
    state = applyImmutable<ConversationListState>(state, ops);
    yield state;
  }
}
