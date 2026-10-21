import { z } from 'zod';

export const chatSearch = z.object({
  message: z.number().int().positive().optional().catch(undefined),
  find: z.boolean().optional().catch(undefined),
});

export const chatResetSearch = z.object({ handoff: z.string().optional().catch(undefined) });

export const chatIndexSearch = z.object({ start: z.boolean().optional().catch(undefined) });
