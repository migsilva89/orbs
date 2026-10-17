import { match, P } from 'ts-pattern';
import { mcpQueryConfig } from './mcp-query.config';
import { mcpFingerprint } from './mcp.utils';
import type { McpServiceDeps } from '../../types/mcp.types';
import type { ResourceMcpCatalog } from '@openbots/contracts/universal';
import type { McpParams } from '@openbots/server/server';

export async function mcpQueryCatalog(deps: McpServiceDeps, params: McpParams): Promise<ResourceMcpCatalog> {
  const config = await mcpQueryConfig(deps, params);
  const diagnostics = [...config.diagnostics];

  const servers = config.servers.map((entry) => {
    const saved = deps.connections.get(`${params.botId}:${entry.name}`);
    const connection = saved?.fingerprint === mcpFingerprint(entry) ? saved : undefined;
    const isEnabled = entry.config.enabled !== false && entry.config.disabled !== true;

    const status = match({ isEnabled, connection })
      .with({ isEnabled: false }, () => 'disabled' as const)
      .with({ connection: { error: P.string } }, () => 'error' as const)
      .with({ connection: { client: { connectionState: 'connected' } } }, () => 'connected' as const)
      .with({ connection: { client: { connectionState: 'connecting' } } }, () => 'connecting' as const)
      .otherwise(() => 'disconnected' as const);

    match(connection?.error)
      .with(P.string, (message) => diagnostics.push({
        source: entry.source,
        server: entry.name,
        message,
      }))
      .otherwise(() => undefined);

    return {
      name: entry.name,
      description: entry.config.description ?? '',
      source: entry.source,
      transport: entry.config.command === undefined ? 'http' as const : 'stdio' as const,
      isEnabled,
      status,
      tools: status === 'connected' ? connection?.catalog ?? [] : [],
    };
  });

  return { servers, diagnostics };
}
