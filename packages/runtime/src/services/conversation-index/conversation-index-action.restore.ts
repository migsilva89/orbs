import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind, conversationIndexLatest } from './conversation-index.utils';
import type { ConversationIndexDeps, ConversationIndexRestoreParams } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export async function conversationIndexActionRestore(
  { harness, conversations }: ConversationIndexDeps,
  { botId, conversationId }: ConversationIndexRestoreParams,
  context: Context,
) {
  return match(conversations.has(conversationId))
    .with(true, () => undefined)
    .with(false, async () => {
      const conversation = match(await harness.conversation(conversationId, context))
        .with(P.nonNullable, (value) => value)
        .otherwise(() => {
          throw new Errors.INTERNAL_ERROR({ internal: 'Indexed bot conversation is missing.' });
        });

      await harness.commit(async (tx) => {
        const index = await tx.doc(conversationIndex);
        index.conversations[conversationId] ??= {
          botId,
          conversationId,
          lastMessage: null,
          lastAssistantEntryId: 0,
          readThroughEntryId: 0,
          isPinned: false,
        };
      }, context);

      // Observe new commits before scanning; restoration must not overwrite a newer preview.
      conversations.add(conversationId);

      try {
        const { lastMessage, lastAssistantEntryId } = await conversationIndexLatest(conversation, context);
        await harness.commit(async (tx) => {
          const index = await tx.doc(conversationIndex);
          const current = conversationIndexFind(index, botId);

          const latest = match((lastMessage?.entryId ?? 0) > (current.lastMessage?.entryId ?? 0))
            .with(true, () => lastMessage)
            .with(false, () => current.lastMessage ?? null)
            .exhaustive();

          current.lastMessage = latest;
          current.lastAssistantEntryId = Math.max(current.lastAssistantEntryId, lastAssistantEntryId);
        }, context);
      } catch (error) {
        conversations.delete(conversationId);
        throw error;
      }
    })
    .exhaustive();
}
