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

export type ConversationFrame = z.infer<typeof conversationFrame>;
export type { ConversationView } from '@earendil-works/pi-durable';
