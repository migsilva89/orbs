import { defineDoc, defineDocFamily } from '@earendil-works/pi-durable';
import type { CollaborationCall, CollaborationTemporaryBinding, CollaborationTemporaryContext } from '../../types/collaboration.types';

export const collaborationCall = defineDoc({
  kind: 'openbots.bot-delivery-call',
  version: 1,
  scope: 'task',
  initial: (): CollaborationCall => ({ deliveryId: null }),
});

export const collaborationTemporaryBinding = defineDocFamily<CollaborationTemporaryBinding, null>({
  kind: 'openbots.bot-temporary-binding',
  version: 1,
  scope: 'conversation',
  family: true,
  history: 'latest',
  fork: 'initial',
  initial: () => ({ conversationId: null, expiresAt: null }),
});

export const collaborationTemporaryContext = defineDoc<CollaborationTemporaryContext>({
  kind: 'openbots.bot-temporary-context',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({
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
  message: 'openbots.bot-message',
  reply: 'openbots.bot-reply',
} as const;
