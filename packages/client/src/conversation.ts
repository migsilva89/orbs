import { applyImmutable } from '@earendil-works/chord/delta';
import type { Client } from './types/client.types';
import type { ConversationTarget, ConversationView } from '@openbots/contracts/universal';

export async function* watchConversation(client: Client, params: ConversationTarget, signal: AbortSignal) {
  const frames = await client.conversation.watch(params, { signal });
  let view: ConversationView | undefined;

  for await (const ops of frames) {
    view = applyImmutable<ConversationView>(view, ops);
    yield view;
  }
}
