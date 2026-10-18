import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind, conversationIndexPreferences } from './conversation-index.utils';
import type { ConversationIndexServiceDeps } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationSetPinnedInput } from '@openbots/contracts/universal';

export function conversationIndexActionSetPinned(
  { harness }: ConversationIndexServiceDeps,
  { botId, isPinned }: ConversationSetPinnedInput,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const conversation = conversationIndexFind(await tx.doc(conversationIndex), botId);
    conversation.isPinned = isPinned;

    return conversationIndexPreferences(conversation);
  }, context);
}
