import type { ConversationId, Harness, JsonObject } from '@earendil-works/pi-durable';
import type { ConversationSummary } from '@openbots/contracts/universal';

export type ConversationIndexItem = Omit<ConversationSummary, 'isRunning'>;

export interface ConversationIndexDocument extends JsonObject {
  conversations: Record<string, ConversationIndexItem | null>;
}

export interface ConversationIndexServiceDeps {
  harness: Harness;
}

export interface ConversationIndexRestoreParams {
  botId: string;
  conversationId: ConversationId;
}

export interface ConversationIndexDeps extends ConversationIndexServiceDeps {
  conversations: Set<ConversationId>;
}

export interface ConversationIndexUpdate {
  conversationId: ConversationId;
  lastMessage: NonNullable<ConversationSummary['lastMessage']>;
}
