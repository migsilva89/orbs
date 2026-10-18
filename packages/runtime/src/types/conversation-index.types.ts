import { conversationSummary } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { ConversationId, Harness, JsonObject } from '@earendil-works/pi-durable';
import type { ConversationSummary } from '@openbots/contracts/universal';

export type ConversationIndexItem = Omit<ConversationSummary, 'isRunning' | 'hasUnread'> & {
  lastAssistantEntryId: number;
};

export interface ConversationIndexPreview {
  lastMessage: ConversationSummary['lastMessage'];
  lastAssistantEntryId: number;
}

export const conversationIndexV1 = z.object({
  conversations: z.record(z.string(), conversationSummary.pick({
    botId: true,
    conversationId: true,
    lastMessage: true,
  }).nullable()),
});

export const conversationIndexV2 = z.object({
  conversations: z.record(z.string(), conversationSummary.pick({
    botId: true,
    conversationId: true,
    lastMessage: true,
    isPinned: true,
    readThroughEntryId: true,
  }).extend({
    lastAssistantEntryId: z.number().int().nonnegative(),
  }).nullable()),
});

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

export interface ConversationIndexSetHiddenParams {
  botId: string;
  isHidden: boolean;
}

export interface ConversationIndexSetMutedParams {
  botId: string;
  isMuted: boolean;
}

export interface ConversationIndexArrangeParams {
  botIds: string[];
}

export interface ConversationIndexDeps extends ConversationIndexServiceDeps {
  conversations: Set<ConversationId>;
}

export interface ConversationIndexUpdate {
  conversationId: ConversationId;
  lastMessage: NonNullable<ConversationSummary['lastMessage']>;
}
