import { mcpQueryConfig } from './mcp-query.config';
import { mcpQuerySettings } from './mcp-query.settings';
import type { McpBotParams, McpServiceDeps } from '../../types/mcp.types';

export async function mcpQueryDiscover(deps: McpServiceDeps, { bot }: McpBotParams) {
  const settings = await mcpQuerySettings(deps);

  const config = await mcpQueryConfig(deps, {
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('mcp'),
  });

  return deps.clients.queries.catalog({ botId: bot.id, config });
}
