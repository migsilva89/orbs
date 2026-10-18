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
  inbox: PiDurableTypes.InboxState;
}

export interface ConversationContextWatchState {
  revision: number;
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

export const conversationContexts = conversationTarget.extend({
  kind: z.enum(['subagent', 'temporary']),
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.record(z.string(), z.json()).optional(),
});

const conversationContext = z.object({
  botId: z.uuid(),
  conversationId: z.number().int().positive(),
  isRunning: z.boolean(),
});

export const conversationContextItem = z.discriminatedUnion('kind', [
  conversationContext.extend({
    kind: z.literal('subagent'),
    name: z.string().nullable(),
    ownerTaskId: z.number().int().positive(),
    isBackground: z.boolean(),
  }),
  conversationContext.extend({
    kind: z.literal('temporary'),
    createdAt: z.number(),
    expiresAt: z.number(),
    archivedAt: z.number().nullable(),
  }),
]);

export const conversationContextPage = z.object({
  items: z.array(conversationContextItem),
  next: z.record(z.string(), z.json()).optional(),
});

export type ConversationContextsInput = z.infer<typeof conversationContexts>;
export type ConversationContextItem = z.infer<typeof conversationContextItem>;
export type ConversationContextPage = z.infer<typeof conversationContextPage>;

export const conversationPreferences = z.object({
  isPinned: z.boolean(),
  readThroughEntryId: z.number().int().nonnegative(),
  hasUnread: z.boolean(),
});

export const conversationMarkRead = z.object({
  botId: z.uuid(),
  throughEntryId: z.number().int().positive(),
});

export const conversationSetPinned = z.object({
  botId: z.uuid(),
  isPinned: z.boolean(),
});

export const conversationSummary = conversationPreferences.extend({
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

export type ConversationPreferences = z.infer<typeof conversationPreferences>;
export type ConversationMarkReadInput = z.infer<typeof conversationMarkRead>;
export type ConversationSetPinnedInput = z.infer<typeof conversationSetPinned>;
