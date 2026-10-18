import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeReactions } from './runtime-reaction.constants';
import { runtimeReactionTarget, runtimeReactionView } from './runtime-reaction.utils';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId } from '@earendil-works/pi-durable';
import type { ConversationReaction, ConversationReactionsInput } from '@openbots/contracts/universal';

export async function runtimeQueryReactions(
  deps: RuntimeServiceDeps,
  params: ConversationReactionsInput,
  context: Context,
): Promise<ConversationReaction[]> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  const visibleIds = await deps.harness.commit(async (tx) => {
    const entries = await Promise.all(params.entryIds.map((id) => tx.entry(id as EntryId)));

    return params.entryIds.filter((_, index) => runtimeReactionTarget(entries[index], conversation.id) !== undefined);
  }, context);

  return Promise.all(visibleIds.map(async (entryId) => {
    const document = await deps.harness.snapshot(runtimeReactions, conversation.id, String(entryId), context);

    return runtimeReactionView(entryId, document ?? { emojis: [], botReactions: [] });
  }));
}
