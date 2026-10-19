import { credentialsKey } from '@openbots/contracts/universal';
import { z } from 'zod';
import type { McpAuthService } from '../services/mcp-auth/mcp-auth.service';
import type { ToolRegistration } from '@earendil-works/pi-durable';
import type { AuthProvider, McpClient } from '@earendil-works/pi-mcp';
import type { McpCatalog } from '@openbots/contracts/universal';

export interface McpClientServiceDeps {
  root: string;
  auth: McpAuthService;
  connections: Map<string, McpConnection>;
}

export interface McpEntry {
  name: string;
  source: string;
  config: z.infer<typeof mcpServer>;
  /** Read from the bot's own folder, which the bot can write. Such servers never get stored OAuth tokens. */
  isBotLocal: boolean;
  sourceFingerprint?: string;
}

export interface McpConfig {
  servers: McpEntry[];
  diagnostics: McpCatalog['diagnostics'];
}

export interface McpConnection {
  fingerprint: string;
  sourceFingerprint: string;
  client: McpClient;
  authProvider?: AuthProvider;
  tools: ToolRegistration[];
  catalog: McpCatalog['servers'][number]['tools'];
  ready: Promise<void>;
  hasToolChanges: boolean;
  error?: string;
}

export interface McpConnectParams {
  botId: string;
  entry: McpEntry;
}

export interface McpClientParams {
  botId: string;
  config: McpConfig;
}

export interface McpSource {
  source: string;
  servers: z.infer<typeof mcpDocument>['mcpServers'];
  error?: string;
}

export const mcpDocument = z.object({
  mcpServers: z.record(z.string().min(1), z.json()),
});

const mcpConfig = z.object({
  description: z.string().optional(),
  enabled: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

export const mcpServer = z.union([
  mcpConfig.extend({
    command: z.string().trim().min(1),
    args: z.array(z.string()).optional(),
    cwd: z.string().min(1).optional(),
    env: z.record(z.string(), z.string()).optional(),
    envCredentials: z.record(z.string().min(1), credentialsKey).optional(),
    type: z.literal('stdio').optional(),
    url: z.never().optional(),
  }),
  mcpConfig.extend({
    url: z.url({ protocol: /^https?$/ }),
    headers: z.record(z.string(), z.string()).optional(),
    headerCredentials: z.record(z.string().min(1), credentialsKey).optional(),
    type: z.literal('http').optional(),
    command: z.never().optional(),
  }),
]);
