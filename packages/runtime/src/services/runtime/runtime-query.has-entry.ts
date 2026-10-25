import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeEntryParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { EntryId } from '@earendil-works/pi-durable';

export async function runtimeQueryHasEntry(deps: RuntimeServiceDeps, { botId, entryId, context }: RuntimeEntryParams & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  // SAFETY: an entry ID is only a lookup key; the result is compared with this conversation below.
  const entry = await deps.harness.commit((tx) => tx.entry(entryId as EntryId), context);

  return entry?.conversationId === conversation.id;
}
