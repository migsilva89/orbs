import { defineDoc } from '@earendil-works/pi-durable';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';

export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'openbots.conversation-index',
  version: 1,
  scope: 'session',
  initial: () => ({ conversations: {} }),
});
