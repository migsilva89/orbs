import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface CollaborationBot {
  id: string;
  name: string;
  handle: string;
}

export interface CollaborationBotParams {
  botId: string;
}

export interface CollaborationRecipientParams extends CollaborationBotParams {
  recipientId: string;
  isPeerInput: boolean;
}

export interface CollaborationPolicy {
  queries: {
    bots(params: CollaborationBotParams): Promise<CollaborationBot[]>;
    recipient(params: CollaborationRecipientParams): Promise<{
      sender: CollaborationBot;
      recipient: CollaborationBot;
      maxPending: number;
      temporaryTtlMs: number;
    }>;
  };
}

/** Resolves another bot's Pi store; peer delivery crosses stores through stable request IDs. */
export interface CollaborationDirectory {
  harness(botId: string): Promise<PiDurableTypes.Harness>;
}

export interface CollaborationDeps {
  policy: CollaborationPolicy;
  directory: CollaborationDirectory;
}

export interface CollaborationDeliveryInput extends PiDurableTypes.JsonObject {
  requestId: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  recipientConversationId: PiDurableTypes.ConversationId;
  message: string;
  mode: 'ask' | 'send';
}

export type CollaborationResult =
  | { status: 'answered'; answerId: PiDurableTypes.EntryId; text: string }
  | { status: 'unanswered'; reason: string };

export type CollaborationDeliveryState =
  | { phase: 'deliver' }
  | { phase: 'report'; result: CollaborationResult; report: string | null };

export interface CollaborationToolDeps extends CollaborationDeps {
  delivery: PiDurableTypes.Task<CollaborationDeliveryInput, CollaborationDeliveryState, CollaborationResult, object>;
}

export interface CollaborationSendParams {
  botId: string;
  message: string;
  mode: 'ask' | 'send';
  context?: 'existing' | 'temporary';
}

export interface CollaborationTargetParams {
  senderId: string;
  senderStoreId: string;
  sourceConversationId: PiDurableTypes.ConversationId;
  recipientId: string;
  context?: 'existing' | 'temporary';
  temporaryTtlMs: number;
}

export interface CollaborationTemporaryBinding extends PiDurableTypes.JsonObject {
  conversationId: PiDurableTypes.ConversationId | null;
  expiresAt: number | null;
}

export interface CollaborationTemporaryContext extends PiDurableTypes.JsonObject {
  senderId: string | null;
  sourceConversationId: PiDurableTypes.ConversationId | null;
  recipientId: string | null;
  createdAt: number | null;
  expiresAt: number | null;
  archivedAt: number | null;
}

/** Sender-side pointers to temporary contexts that live in recipient stores. */
export interface CollaborationTemporaryLinks extends PiDurableTypes.JsonObject {
  links: { recipientId: string; conversationId: PiDurableTypes.ConversationId; createdAt: number }[];
}

export interface CollaborationStore extends PiDurableTypes.JsonObject {
  storeId: string | null;
}

export interface CollaborationCall extends PiDurableTypes.JsonObject {
  deliveryId: PiDurableTypes.TaskId<CollaborationResult> | null;
}
