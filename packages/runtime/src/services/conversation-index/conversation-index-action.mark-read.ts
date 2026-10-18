import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind, conversationIndexPreferences } from './conversation-index.utils';
import type { ConversationIndexServiceDeps } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';
import type { EntryId } from '@earendil-works/pi-durable';
import type { ConversationMarkReadInput } from '@openbots/contracts/universal';

export function conversationIndexActionMarkRead(
  { harness }: ConversationIndexServiceDeps,
  { botId, throughEntryId }: ConversationMarkReadInput,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const conversation = conversationIndexFind(await tx.doc(conversationIndex), botId);
    const entry = await tx.entry(throughEntryId as EntryId);

    match(entry?.conversationId === conversation.conversationId)
      .with(true, () => {
        conversation.readThroughEntryId = Math.max(conversation.readThroughEntryId, throughEntryId);
      })
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: 'entry', resourceId: throughEntryId });
      })
      .exhaustive();

    return conversationIndexPreferences(conversation);
  }, context);
}
