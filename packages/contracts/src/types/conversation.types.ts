import { assertValidOp } from '@earendil-works/chord/delta';
import { type } from '@orpc/contract';
import { z } from 'zod';
import type { Op } from '@earendil-works/chord/delta';
import type { Cursor, EntryRecord, Page } from '@earendil-works/pi-durable';

export const conversationFrame = z.array(z.custom<Op>((value) => {
  try {
    assertValidOp(value);
    return true;
  } catch {
    return false;
  }
})).readonly();

export const conversationTarget = z.object({ botId: z.uuid() });

export const conversationSubmit = conversationTarget.extend({
  requestId: z.string().min(1).max(128),
  content: z.string().min(1).max(64_000),
  whenBusy: z.enum(['followUp', 'steer', 'reject']).optional(),
});

export const conversationSubmitResult = z.object({
  submissionId: z.number().int().positive(),
});

export const conversationStopResult = z.void();

export const conversationHistory = conversationTarget.extend({
  limit: z.number().int().min(1).max(100).default(50),
  cursor: z.record(z.string(), z.json()).optional(),
});

export type ConversationHistoryPage = Page<EntryRecord, Cursor>;
export const conversationHistoryResult = type<ConversationHistoryPage>();
export type ConversationHistoryInput = z.infer<typeof conversationHistory>;

export type ConversationSubmitInput = z.infer<typeof conversationSubmit>;
export type ConversationTarget = z.infer<typeof conversationTarget>;
export type ConversationFrame = z.infer<typeof conversationFrame>;
export type { ConversationView } from '@earendil-works/pi-durable';
