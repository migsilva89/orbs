import { REACTION } from '@openbots/contracts/universal';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeReactions } from './runtime-reaction.constants';
import { runtimeReactionTarget } from './runtime-reaction.utils';
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
        const hasEmoji = document.emojis.includes(params.emoji);

        match({ isPresent: params.isPresent, hasEmoji })
          .with({ isPresent: true, hasEmoji: true }, { isPresent: false, hasEmoji: false }, () => undefined)
          .with({ isPresent: true, hasEmoji: false }, () => {
            match(document.emojis.length < REACTION.maxPerEntry)
              .with(false, () => {
                throw new Errors.VALIDATION_ERROR({
                  fields: { emoji: { message: 'validation_reaction_limit', args: { max: REACTION.maxPerEntry } } },
                });
              })
              .with(true, () => undefined)
              .exhaustive();

            document.emojis.push(params.emoji);
          })
          .with({ isPresent: false, hasEmoji: true }, () => {
            document.emojis = document.emojis.filter((emoji) => emoji !== params.emoji);
          })
          .exhaustive();

        return { entryId: params.entryId, emojis: [...document.emojis] };
      });
  }, context);
}
