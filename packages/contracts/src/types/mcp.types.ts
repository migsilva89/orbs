import { z } from 'zod';

export const mcpSettings = z.object({
  paths: z.array(z.string().trim().min(1).max(4096)).max(50),
});

export const mcpConfigure = mcpSettings.partial();

export const mcpDiscover = z.object({ botId: z.uuid() });

export const mcpCatalogTool = z.object({
  name: z.string(),
  runtimeName: z.string(),
  title: z.string(),
  description: z.string(),
});

export const mcpCatalogServer = z.object({
  name: z.string(),
  description: z.string(),
  source: z.string(),
  transport: z.enum(['stdio', 'http']),
  isEnabled: z.boolean(),
  status: z.enum(['disabled', 'disconnected', 'connecting', 'connected', 'error']),
  /** OAuth login state: `required` when the server rejected the connection for missing or expired login. */
  auth: z.enum(['none', 'required', 'authorized']),
  tools: z.array(mcpCatalogTool),
});

export const mcpCatalog = z.object({
  servers: z.array(mcpCatalogServer),
  diagnostics: z.array(z.object({
    source: z.string(),
    server: z.string().optional(),
    message: z.string(),
  })),
});

export type McpSettings = z.infer<typeof mcpSettings>;
export type McpConfigureInput = z.infer<typeof mcpConfigure>;
export type McpCatalog = z.infer<typeof mcpCatalog>;
