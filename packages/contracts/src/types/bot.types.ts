import { z } from 'zod';

export const botFields = z.object({
  name: z.string().trim().min(1).max(64),
  handle: z.string().trim().toLowerCase().min(1).max(48).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  instructions: z.string().max(16000),
  modelProvider: z.string().trim().min(1).max(128),
  modelId: z.string().trim().min(1).max(128),
  thinkingLevel: z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']),
});

export const bot = botFields.extend({
  id: z.uuid(),
  createdAt: z.number().int(),
  updatedAt: z.number().int(),
});

export const botList = z.array(bot);
export const botGet = z.object({ botId: z.uuid() });

export const botCreate = botFields.extend({
  instructions: botFields.shape.instructions.default(''),
  thinkingLevel: botFields.shape.thinkingLevel.default('off'),
});

export const botUpdate = botFields.partial().extend(botGet.shape);

export type Bot = z.infer<typeof bot>;
export type BotCreateInput = z.infer<typeof botCreate>;
export type BotUpdateInput = z.infer<typeof botUpdate>;
export type BotGetInput = z.infer<typeof botGet>;
