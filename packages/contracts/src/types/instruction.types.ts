import { z } from 'zod';

export const instructionSettings = z.object({
  paths: z.array(z.string().trim().min(1).max(4096)).max(50),
});

export const instructionConfigure = instructionSettings.partial();

export const instructionDiscover = z.object({ botId: z.uuid() });

export const instructionCatalog = z.object({
  files: z.array(z.object({
    path: z.string(),
    content: z.string(),
  })),
  diagnostics: z.array(z.object({
    path: z.string(),
    message: z.string(),
  })),
});

export type InstructionSettings = z.infer<typeof instructionSettings>;
export type InstructionConfigureInput = z.infer<typeof instructionConfigure>;
export type InstructionCatalog = z.infer<typeof instructionCatalog>;
