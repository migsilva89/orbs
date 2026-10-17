import { z } from 'zod';

export interface McpSource {
  source: string;
  servers: z.infer<typeof mcpDocument>['mcpServers'];
  error?: string;
}

export const mcpDocument = z.object({
  mcpServers: z.record(z.string().min(1), z.json()),
});

export const mcpServer = z.object({
  command: z.string().trim().min(1).optional(),
  url: z.url({ protocol: /^https?$/ }).optional(),
  type: z.enum(['stdio', 'http']).optional(),
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  disabled: z.boolean().optional(),
}).refine((server) => Boolean(server.command) !== Boolean(server.url))
  .refine((server) => server.type !== 'stdio' || server.command !== undefined)
  .refine((server) => server.type !== 'http' || server.url !== undefined);
