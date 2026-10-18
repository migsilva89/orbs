import { z } from 'zod';

export const skillSettings = z.object({
  directories: z.array(z.string().trim().min(1).max(4096)).max(50),
});

export const skillConfigure = skillSettings.partial();

export const skillDiscover = z.object({ botId: z.uuid() });

export const skill = z.object({
  name: z.string(),
  description: z.string(),
  filePath: z.string(),
  isModelInvocable: z.boolean(),
  argumentsSchema: z.record(z.string(), z.json()),
  argumentHint: z.string().nullable(),
});

export const skillCatalog = z.array(skill);

export type SkillSettings = z.infer<typeof skillSettings>;
export type SkillConfigureInput = z.infer<typeof skillConfigure>;
export type Skill = z.infer<typeof skill>;
