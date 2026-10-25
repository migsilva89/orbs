import { defineDoc } from '@earendil-works/pi-durable';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';

/** Pi-derived chat summaries of one bot store. Owner preferences such as pin and mute live in app SQL. */
export const conversationIndex = defineDoc<ConversationIndexDocument>({
  kind: 'bots.conversation-summary',
  version: 1,
  scope: 'session',
  initial: () => ({ conversations: {} }),
  checkpointWhen: () => false,
});
