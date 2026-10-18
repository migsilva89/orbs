import { conversationIndex } from './conversation-index.constants';
import { conversationIndexFind, conversationIndexPreferences } from './conversation-index.utils';
import type { ConversationIndexServiceDeps, ConversationIndexSetMutedParams } from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export function conversationIndexActionSetMuted(
  { harness }: ConversationIndexServiceDeps,
  { botId, isMuted }: ConversationIndexSetMutedParams,
  context: Context,
) {
  return harness.commit(async (tx) => {
    const conversation = conversationIndexFind(await tx.doc(conversationIndex), botId);
    conversation.isMuted = isMuted;

    return conversationIndexPreferences(conversation);
  }, context);
}
