import { z } from 'zod';

export const conversationContextUsage = z.object({
  contextWindow: z.number().positive().nullable(),
  estimatedTokens: z.number().nonnegative(),
});

export type ConversationContextUsage = z.infer<typeof conversationContextUsage>;
