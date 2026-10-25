import { REACTION } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { isMatching, match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeQueryQuote } from './runtime-query.quote';
import { runtimeReactions } from './runtime-reaction.constants';
import { runtimeReactionTask } from './runtime-reaction.task';
import { runtimeReactionTarget, runtimeReactionToggle, runtimeReactionView } from './runtime-reaction.utils';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { EntryId } from '@earendil-works/pi-durable';
import type { ConversationReaction, ConversationSetReactionInput } from '@repo/contracts/universal';

export async function runtimeActionSetReaction(
  deps: RuntimeServiceDeps,
  params: ConversationSetReactionInput & RuntimeContextInput,
): Promise<ConversationReaction> {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);

  const quote = params.isPresent ? await runtimeQueryQuote(deps, {
    conversationId: conversation.id,
    entryId: params.entryId,
    context,
  }) : undefined;

  const reaction = await conversation.commit(async (tx) => {
    // SAFETY: an entry ID is only a lookup key; runtimeReactionTarget rejects entries outside this conversation.
    return match(runtimeReactionTarget(await tx.entry(params.entryId as EntryId), conversation.id))
      .with(P.nullish, () => {
        throw new Errors.NOT_FOUND({ resource: 'entry', resourceId: params.entryId });
      })
      .otherwise(async () => {
        const document = await tx.doc(runtimeReactions, conversation.id, String(params.entryId), null);
        const isAdded = quote !== undefined && !document.emojis.includes(params.emoji);
        runtimeReactionToggle(document.emojis, params.emoji, params.isPresent);

        const scheduled = await tx.scanTasks({
          conversationId: conversation.id,
          kind: runtimeReactionTask.definition.name,
          order: 'descending',
        }, 50);

        const isScheduled = scheduled.items.some((task) => task.state.status !== 'terminal'
          && isMatching({ entryId: params.entryId, emoji: params.emoji }, task.input));

        if (isAdded && !isScheduled) {
          await tx.createTask(runtimeReactionTask, {
            entryId: params.entryId,
            emoji: params.emoji,
            quote,
            deliverAt: Date.now() + REACTION.deliverMs,
          }, {
            conversationId: conversation.id,
            ownership: { kind: 'conversation' },
            background: true,
          });
        }

        return runtimeReactionView(params.entryId, document);
      });
  }, context);

  deps.harness.resume();

  return reaction;
}
