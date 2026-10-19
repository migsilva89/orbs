import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import { ENTRY } from '@openbots/contracts/universal';
import type * as CollaborationTypes from '../../types/collaboration.types';

export const collaborationCall = defineDoc({
  kind: 'openbots.bot-delivery-call',
  version: 1,
  scope: 'task',
  initial: (): CollaborationTypes.CollaborationCall => ({ deliveryId: null }),
});

/** Random ID of the sender's store. A history clear starts a new store, so old peer bindings and request IDs never match it. */
export const collaborationStore = defineDoc<CollaborationTypes.CollaborationStore>({
  kind: 'openbots.bot-store',
  version: 1,
  scope: 'session',
  initial: () => ({ storeId: null }),
});

/** Recipient-store binding keyed by `senderId:senderStoreId:sourceConversationId`. */
export const collaborationTemporaryBinding = defineDocFamily<CollaborationTypes.CollaborationTemporaryBinding, null>({
  kind: 'openbots.bot-temporary-binding',
  version: 1,
  scope: 'session',
  family: true,
  initial: () => ({ conversationId: null, expiresAt: null }),
});

export const collaborationTemporaryLinks = defineDoc<CollaborationTypes.CollaborationTemporaryLinks>({
  kind: 'openbots.bot-temporary-links',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ links: [] }),
});

export const collaborationTemporaryContext = defineDoc<CollaborationTypes.CollaborationTemporaryContext>({
  kind: 'openbots.bot-temporary-context',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({
    senderId: null,
    sourceConversationId: null,
    recipientId: null,
    createdAt: null,
    expiresAt: null,
    archivedAt: null,
  }),
});

export const COLLABORATION = {
  extension: 'openbots.collaboration',
  delivery: 'openbots.bot-delivery',
  message: ENTRY.peerMessage,
  reply: ENTRY.peerReply,
} as const;
