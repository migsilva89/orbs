import { applyImmutable } from '@earendil-works/chord/delta';
import type { Client } from './types/client.types';
import type { ConversationContextWatchState, ConversationTarget } from '@repo/contracts/universal';

export async function* watchConversationContexts(client: Client, params: ConversationTarget, signal: AbortSignal) {
  const frames = await client.conversation.watchContexts(params, { signal });
  let state: ConversationContextWatchState | undefined;

  for await (const ops of frames) {
    state = applyImmutable<ConversationContextWatchState>(state, ops);
    yield state;
  }
}
