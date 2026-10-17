import { assertValidOp } from '@earendil-works/chord/delta';
import { z } from 'zod';
import type { Op } from '@earendil-works/chord/delta';

export const conversationFrame = z.array(z.custom<Op>((value) => {
  try {
    assertValidOp(value);
    return true;
  } catch {
    return false;
  }
})).readonly();

export const conversationSubmit = z.object({
  requestId: z.string().min(1).max(128),
  content: z.string().min(1),
  whenBusy: z.enum(['followUp', 'steer', 'reject']).optional(),
});

export const conversationSubmitResult = z.object({
  submissionId: z.number().int().positive(),
});

export const conversationStopResult = z.void();

export type ConversationSubmitInput = z.infer<typeof conversationSubmit>;
export type ConversationFrame = z.infer<typeof conversationFrame>;
export type { ConversationView } from '@earendil-works/pi-durable';
