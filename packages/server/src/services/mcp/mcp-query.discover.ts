import { match, P } from 'ts-pattern';
import { mcpQueryConfig } from './mcp-query.config';
import { mcpQuerySettings } from './mcp-query.settings';
import type { McpBotParams, McpServiceDeps } from '../../types/mcp.types';
import type { McpCatalog } from '@openbots/contracts/universal';
import type { McpEntry } from '@openbots/runtime/server';

export async function mcpQueryDiscover(deps: McpServiceDeps, { bot }: McpBotParams) {
  const settings = await mcpQuerySettings(deps);

  const config = await mcpQueryConfig(deps, {
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('mcp'),
  });

  const diagnostics = await Promise.all(config.servers.map(mcpDiscoverCredentials));

  return deps.clients.queries.catalog({
    botId: bot.id,
    config: {
      servers: config.servers,
      diagnostics: [...config.diagnostics, ...diagnostics.flat()],
    },
  });

  async function mcpDiscoverCredentials(entry: McpEntry): Promise<McpCatalog['diagnostics']> {
    const names = match(entry.config)
      .with({ command: P.string }, (stdio) => Object.values(stdio.envCredentials ?? {}))
      .otherwise((http) => Object.values(http.headerCredentials ?? {}));

    const missing = await Promise.all(names.map(async (name) => {
      const hasCredential = await deps.credentials.queries.has({ key: name });

      return match(hasCredential)
        .with(false, () => ({
          source: entry.source,
          server: entry.name,
          message: `Missing MCP credential '${name}'.`,
        }))
        .with(true, () => undefined)
        .exhaustive();
    }));

    return missing.filter((diagnostic) => diagnostic !== undefined);
  }
}
