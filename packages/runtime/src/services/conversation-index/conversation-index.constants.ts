import { defineDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { conversationIndexV1 } from '../../types/conversation-index.types';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';

export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'openbots.conversation-index',
  version: 2,
  scope: 'session',
  initial: () => ({ conversations: {} }),
  migrate: (value) => ({
    conversations: Object.fromEntries(Object.entries(conversationIndexV1.parse(value).conversations)
      .map(([id, conversation]) => [id, match(conversation)
        .with(P.nonNullable, (item) => ({ ...item, isPinned: false, readThroughEntryId: 0, lastAssistantEntryId: 0 }))
        .otherwise(() => null)])),
  }),
});
