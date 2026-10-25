import { z } from 'zod';

const conversationUsageCost = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number(),
  cacheWrite: z.number(),
  total: z.number(),
});

const conversationUsageBucket = z.object({
  input: z.number(),
  output: z.number(),
  cacheRead: z.number(),
  cacheWrite: z.number(),
  cacheWrite1h: z.number().optional(),
  reasoning: z.number().optional(),
  totalTokens: z.number(),
  cost: conversationUsageCost,
});

export const conversationUsage = z.object({
  models: z.record(z.string(), conversationUsageBucket),
  tools: z.record(z.string(), conversationUsageBucket),
});

export type ConversationUsage = z.infer<typeof conversationUsage>;
