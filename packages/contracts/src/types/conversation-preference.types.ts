import { z } from 'zod';

export const conversationWhenBusy = z.enum(['followUp', 'steer', 'interrupt']);

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

export const conversationSetWhenBusy = z.object({
  botId: z.uuid(),
  whenBusy: conversationWhenBusy.nullable(),
});

export const conversationSettings = z.object({
  whenBusy: conversationWhenBusy,
  /** Hides tool calls and thinking from chat transcripts. */
  hideVerbose: z.boolean(),
});

export const conversationConfigure = conversationSettings.partial();

export type ConversationSetHiddenInput = z.infer<typeof conversationSetHidden>;
export type ConversationSetMutedInput = z.infer<typeof conversationSetMuted>;
export type ConversationArrangeInput = z.infer<typeof conversationArrange>;
export type ConversationWhenBusy = z.infer<typeof conversationWhenBusy>;
export type ConversationSetWhenBusyInput = z.infer<typeof conversationSetWhenBusy>;
export type ConversationSettings = z.infer<typeof conversationSettings>;
export type ConversationConfigureInput = z.infer<typeof conversationConfigure>;
