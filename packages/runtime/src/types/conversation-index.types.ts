import type { ConversationId, Harness, JsonObject } from '@earendil-works/pi-durable';
import type { ConversationSummary } from '@repo/contracts/universal';

export type ConversationIndexItem = Pick<ConversationSummary, 'botId' | 'conversationId' | 'lastMessage'> & {
  lastAssistantEntryId: number;
};

export type ConversationIndexSummary = ConversationIndexItem & { isRunning: boolean };

export interface ConversationIndexPreview {
  lastMessage: ConversationSummary['lastMessage'];
  lastAssistantEntryId: number;
}

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
