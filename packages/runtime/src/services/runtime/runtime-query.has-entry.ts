import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeEntryParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId } from '@earendil-works/pi-durable';

/** Whether `entryId` is a saved entry of the bot's main chat; read positions accept only those. */
export async function runtimeQueryHasEntry(deps: RuntimeServiceDeps, params: RuntimeEntryParams, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  const entry = await deps.harness.commit((tx) => tx.entry(params.entryId as EntryId), context);

  return entry?.conversationId === conversation.id;
}
