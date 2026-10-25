import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeReactions } from './runtime-reaction.constants';
import { runtimeReactionTarget, runtimeReactionView } from './runtime-reaction.utils';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { EntryId } from '@earendil-works/pi-durable';
import type { ConversationReaction, ConversationReactionsInput } from '@repo/contracts/universal';

export async function runtimeQueryReactions(
  deps: RuntimeServiceDeps,
  params: ConversationReactionsInput & RuntimeContextInput,
): Promise<ConversationReaction[]> {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  const visibleIds = await deps.harness.commit(async (tx) => {
    // SAFETY: entry IDs are only lookup keys; runtimeReactionTarget rejects entries outside this conversation.
    const entries = await Promise.all(params.entryIds.map((id) => tx.entry(id as EntryId)));

    return params.entryIds.filter((_, index) => runtimeReactionTarget(entries[index], conversation.id) !== undefined);
  }, context);

  return Promise.all(visibleIds.map(async (entryId) => {
    const document = await deps.harness.snapshot(runtimeReactions, conversation.id, String(entryId), context);

    return runtimeReactionView(entryId, document ?? { emojis: [], botReactions: [] });
  }));
}
