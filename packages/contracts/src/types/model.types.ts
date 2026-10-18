import { z } from 'zod';

export const modelThinkingLevel = z.enum(['off', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max']);

export const modelList = z.array(z.object({
  provider: z.string(),
  id: z.string(),
  name: z.string(),
  thinkingLevels: z.array(modelThinkingLevel),
}));
