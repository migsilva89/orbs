import { assertValidOp } from '@earendil-works/chord/delta';
import { type } from '@orpc/contract';
import { z } from 'zod';
import { botAvatar } from './bot.types';
import type { Op } from '@earendil-works/chord/delta';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export interface ConversationState {
  conversationId: number;
  latestEntryId: number;
  live: PiDurableTypes.LiveState;
}

export interface ConversationView extends ConversationState {
  entries: readonly PiDurableTypes.EntryRecord[];
  historyCursor?: PiDurableTypes.Cursor;
}

export const conversationFrame = z.array(z.custom<Op>((value) => {
  try {
    assertValidOp(value);
    return true;
  } catch {
    return false;
  }
})).readonly();

export type ConversationFrame = z.infer<typeof conversationFrame>;

export const conversationTarget = z.object({
  botId: z.uuid(),
  conversationId: z.number().int().positive().optional(),
});

export const conversationContent = z.string().min(1).max(64_000);

export const conversationSubmit = conversationTarget.extend({
  requestId: z.string().min(1).max(128),
  content: conversationContent,
  skills: z.array(z.string().trim().min(1).max(128)).max(10).optional(),
  whenBusy: z.enum(['followUp', 'steer', 'reject']).optional(),
});

export const conversationSubmitResult = z.object({
  submissionId: z.number().int().positive(),
});

export const conversationStopResult = z.void();

export const conversationHistory = conversationTarget.extend({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.record(z.string(), z.json()).optional(),
  afterEntryId: z.number().int().nonnegative().optional(),
  throughEntryId: z.number().int().positive().optional(),
});

export type ConversationHistoryPage = PiDurableTypes.Page<PiDurableTypes.EntryRecord, PiDurableTypes.Cursor>;
export const conversationHistoryResult = type<ConversationHistoryPage>();
export type ConversationHistoryInput = z.infer<typeof conversationHistory>;

export type ConversationSubmitInput = z.infer<typeof conversationSubmit>;
export type ConversationTarget = z.infer<typeof conversationTarget>;

export const conversationSummary = z.object({
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  lastMessage: z.object({
    entryId: z.number().int().positive(),
    role: z.enum(['user', 'assistant']),
    preview: z.string().max(160),
    createdAt: z.number(),
  }).nullable(),
  isRunning: z.boolean(),
});

export const conversationList = z.array(conversationSummary.extend({
  name: z.string(),
  handle: z.string(),
  avatar: botAvatar.nullable(),
}));

export type ConversationSummary = z.infer<typeof conversationSummary>;
export type ConversationListItem = z.infer<typeof conversationList>[number];
