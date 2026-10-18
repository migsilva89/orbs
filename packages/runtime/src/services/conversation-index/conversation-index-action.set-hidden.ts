import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind, conversationIndexPreferences } from './conversation-index.utils';
import type { ConversationIndexServiceDeps, ConversationIndexSetHiddenParams } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export function conversationIndexActionSetHidden(
  { harness }: ConversationIndexServiceDeps,
  { botId, isHidden }: ConversationIndexSetHiddenParams,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const conversation = conversationIndexFind(await tx.doc(conversationIndex), botId);
    conversation.isHidden = isHidden;

    return conversationIndexPreferences(conversation);
  }, context);
}
