import { z } from 'zod';

export const conversationSetHidden = z.object({
  botId: z.uuid(),
  isHidden: z.boolean(),
});

export const conversationSetMuted = z.object({
  botId: z.uuid(),
  isMuted: z.boolean(),
  mutedUntil: z.number().int().positive().nullable().default(null),
});

export const conversationArrange = z.object({
  botIds: z.array(z.uuid()).max(1000).refine((ids) => new Set(ids).size === ids.length),
});

export const conversationArrangeResult = z.void();

export type ConversationSetHiddenInput = z.infer<typeof conversationSetHidden>;
export type ConversationSetMutedInput = z.infer<typeof conversationSetMuted>;
export type ConversationArrangeInput = z.infer<typeof conversationArrange>;
