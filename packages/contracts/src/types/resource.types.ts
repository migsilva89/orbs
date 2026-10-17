import { z } from 'zod';

export const resourceSettings = z.object({
  skillDirs: z.array(z.string().trim().min(1).max(4096)).max(50),
  mcpPaths: z.array(z.string().trim().min(1).max(4096)).max(50),
});

export const resourceConfigure = resourceSettings.partial();

export const resourceDiscover = z.object({ botId: z.uuid() });

export const resourceSkill = z.object({
  name: z.string(),
  description: z.string(),
  filePath: z.string(),
  isModelInvocable: z.boolean(),
});

export const resourceMcpServer = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  transport: z.enum(['stdio', 'http']),
  isEnabled: z.boolean(),
});

export const resourceMcpCatalog = z.object({
  servers: z.array(resourceMcpServer),
  diagnostics: z.array(z.object({
    source: z.string(),
    server: z.string().optional(),
    message: z.string(),
  })),
});

export const resourceCatalog = z.object({
  skills: z.array(resourceSkill),
  mcp: resourceMcpCatalog,
});

export type ResourceSettings = z.infer<typeof resourceSettings>;
export type ResourceConfigureInput = z.infer<typeof resourceConfigure>;
export type ResourceSkill = z.infer<typeof resourceSkill>;
export type ResourceMcpCatalog = z.infer<typeof resourceMcpCatalog>;
