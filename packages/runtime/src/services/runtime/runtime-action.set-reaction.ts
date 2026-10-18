import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeReactions } from './runtime-reaction.constants';
import { runtimeReactionTarget, runtimeReactionToggle, runtimeReactionView } from './runtime-reaction.utils';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId } from '@earendil-works/pi-durable';
import type { ConversationReaction, ConversationSetReactionInput } from '@openbots/contracts/universal';

export async function runtimeActionSetReaction(
  deps: RuntimeServiceDeps,
  params: ConversationSetReactionInput,
  context: Context,
): Promise<ConversationReaction> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  return conversation.commit(async (tx) => {
    return match(runtimeReactionTarget(await tx.entry(params.entryId as EntryId), conversation.id))
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'entry', resourceId: params.entryId });
      })
      .otherwise(async () => {
        const document = await tx.doc(runtimeReactions, conversation.id, String(params.entryId), null);
        runtimeReactionToggle(document.emojis, params.emoji, params.isPresent);

        return runtimeReactionView(params.entryId, document);
      });
  }, context);
}
