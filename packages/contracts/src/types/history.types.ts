import { z } from 'zod';
import { conversationTarget } from './conversation.types';

export const conversationHistoryMessage = z.object({
  entryId: z.number().int().positive(),
  role: z.enum(['user', 'assistant']),
  botId: z.uuid().optional(),
  text: z.string().min(1),
  createdAt: z.number().int(),
});

export const conversationSearch = conversationTarget.extend({
  query: z.string().trim().min(1).max(200),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.record(z.string(), z.json()).optional(),
});

export const conversationSearchResult = z.object({
  messages: z.array(conversationHistoryMessage),
  cursor: z.record(z.string(), z.json()).optional(),
  hasMore: z.boolean(),
});

export type ConversationHistoryMessage = z.infer<typeof conversationHistoryMessage>;
export type ConversationSearchInput = z.infer<typeof conversationSearch>;
export type ConversationSearchPage = z.infer<typeof conversationSearchResult>;
