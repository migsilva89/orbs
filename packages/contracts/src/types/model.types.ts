import { z } from 'zod';

export const modelThinkingLevel = z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);

export const modelSelection = z.object({
  modelProvider: z.string().trim().min(1).max(128),
  modelId: z.string().trim().min(1).max(128),
  thinkingLevel: modelThinkingLevel,
});

export type ModelSelection = z.infer<typeof modelSelection>;

export const modelList = z.array(z.object({
  provider: z.string(),
  id: z.string(),
  name: z.string(),
  thinkingLevels: z.array(modelThinkingLevel),
}));
