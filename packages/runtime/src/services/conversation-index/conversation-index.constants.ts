import { defineDoc } from '@earendil-works/pi-durable';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';

export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'bots.conversation-summary',
  version: 1,
  scope: 'session',
  initial: () => ({ conversations: {} }),
  checkpointWhen: () => false,
});
