import { Type } from '@earendil-works/pi-ai';
import { conversationSetReaction } from '@repo/contracts/universal';
import { z } from 'zod';
import type { JsonObject } from '@earendil-works/pi-durable';
import type { ReplyQuote } from '@repo/contracts/universal';

export interface RuntimeReactionBot extends JsonObject {
  botId: string;
  emojis: string[];
}

export interface RuntimeReaction extends JsonObject {
  emojis: string[];
  botReactions: RuntimeReactionBot[];
}

export const runtimeReactionTool = conversationSetReaction
  .omit({ botId: true, conversationId: true })
  .extend({ entryId: z.number().int().positive().optional() })
  .strict();

export const runtimeReactionToolParameters = Type.Unsafe<z.infer<typeof runtimeReactionTool>>(z.toJSONSchema(runtimeReactionTool));
export type RuntimeReactionToolInput = z.infer<typeof runtimeReactionTool>;

export interface RuntimeReactionTaskInput {
  entryId: number;
  emoji: string;
  quote: ReplyQuote;
  deliverAt: number;
}

export type RuntimeReactionTaskState = { phase: 'wait' } | { phase: 'check' } | { phase: 'deliver' };
