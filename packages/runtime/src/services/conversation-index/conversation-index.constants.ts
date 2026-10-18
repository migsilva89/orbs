import { defineDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { conversationIndexV1, conversationIndexV2 } from '../../types/conversation-index.types';
import type { ConversationIndexDocument, ConversationIndexItem } from '../../types/conversation-index.types';

function conversationIndexItemV3(item: Omit<ConversationIndexItem, 'isHidden' | 'isMuted' | 'rank'>): ConversationIndexItem {
  return { ...item, isHidden: false, isMuted: false, rank: null };
}

export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'openbots.conversation-index',
  version: 3,
  scope: 'session',
  initial: () => ({ conversations: {} }),
  migrate: (value, fromVersion) => match(fromVersion)
    .with(1, () => ({
      conversations: Object.fromEntries(Object.entries(conversationIndexV1.parse(value).conversations)
        .map(([id, conversation]) => [id, match(conversation)
          .with(P.nonNullable, (item) => conversationIndexItemV3({
            ...item,
            isPinned: false,
            readThroughEntryId: 0,
            lastAssistantEntryId: 0,
          }))
          .otherwise(() => null)])),
    }))
    .with(2, () => ({
      conversations: Object.fromEntries(Object.entries(conversationIndexV2.parse(value).conversations)
        .map(([id, conversation]) => [id, match(conversation)
          .with(P.nonNullable, (item) => conversationIndexItemV3(item))
          .otherwise(() => null)])),
    }))
    .otherwise(() => value as ConversationIndexDocument),
});
