import { Type } from '@earendil-works/pi-ai';
import { conversationSetReaction } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { JsonObject } from '@earendil-works/pi-durable';

export interface RuntimeBotReaction extends JsonObject {
  botId: string;
  emojis: string[];
}

export interface RuntimeReaction extends JsonObject {
  emojis: string[];
  botReactions: RuntimeBotReaction[];
}

export const runtimeReactTool = conversationSetReaction.omit({ botId: true, conversationId: true }).strict();
export const runtimeReactToolParameters = Type.Unsafe<z.infer<typeof runtimeReactTool>>(z.toJSONSchema(runtimeReactTool));
export type RuntimeReactToolInput = z.infer<typeof runtimeReactTool>;
