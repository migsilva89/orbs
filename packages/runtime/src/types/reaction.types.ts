import { Type } from '@earendil-works/pi-ai';
import { conversationSetReaction } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { JsonObject } from '@earendil-works/pi-durable';
import type { MessageQuote } from '@openbots/contracts/universal';

export interface RuntimeBotReaction extends JsonObject {
  botId: string;
  emojis: string[];
}

export interface RuntimeReaction extends JsonObject {
  emojis: string[];
  botReactions: RuntimeBotReaction[];
}

export const runtimeReactTool = conversationSetReaction
  .omit({ botId: true, conversationId: true })
  .extend({ entryId: z.number().int().positive().optional() })
  .strict();

export const runtimeReactToolParameters = Type.Unsafe<z.infer<typeof runtimeReactTool>>(z.toJSONSchema(runtimeReactTool));
export type RuntimeReactToolInput = z.infer<typeof runtimeReactTool>;

export interface RuntimeReactionTaskInput {
  entryId: number;
  emoji: string;
  quote: MessageQuote;
  deliverAt: number;
}

export type RuntimeReactionTaskState = { phase: 'wait' } | { phase: 'deliver' };
