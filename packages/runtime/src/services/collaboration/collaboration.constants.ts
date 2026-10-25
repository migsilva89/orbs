import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import { ENTRY } from '@repo/contracts/universal';
import type * as CollaborationTypes from '../../types/collaboration.types';

export const collaborationCall = defineDoc({
  kind: 'bots.bot-delivery-call',
  version: 1,
  scope: 'task',
  initial: (): CollaborationTypes.CollaborationCall => ({ deliveryId: null }),
  checkpointWhen: () => false,
});

/** Random ID of the sender's store. A history clear starts a new store, so old peer bindings and request IDs never match it. */
export const collaborationStore = defineDoc<CollaborationTypes.CollaborationStore>({
  kind: 'bots.bot-store',
  version: 1,
  scope: 'session',
  initial: () => ({ storeId: null }),
  checkpointWhen: () => false,
});

/** Recipient-store binding keyed by `senderId:senderStoreId:sourceConversationId`. */
export const collaborationTemporaryBinding = defineDocFamily<CollaborationTypes.CollaborationTemporaryBinding, null>({
  kind: 'bots.bot-temporary-binding',
  version: 1,
  scope: 'session',
  family: true,
  initial: () => ({ conversationId: null, expiresAt: null }),
  checkpointWhen: () => false,
});

export const collaborationTemporaryLinks = defineDoc<CollaborationTypes.CollaborationTemporaryLinks>({
  kind: 'bots.bot-temporary-links',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ links: [] }),
  checkpointWhen: () => false,
});

export const collaborationTemporaryContext = defineDoc<CollaborationTypes.CollaborationTemporaryContext>({
  kind: 'bots.bot-temporary-context',
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
  checkpointWhen: () => false,
});

export const COLLABORATION = {
  extension: 'bots.collaboration',
  delivery: 'bots.bot-delivery',
  message: ENTRY.peerMessage,
  reply: ENTRY.peerReply,
} as const;
