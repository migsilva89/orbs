import { mcpQueryConfig } from './mcp-query.config';
import type { McpPrepareParams, McpServiceDeps } from '../../types/mcp.types';

export async function mcpActionPrepare(deps: McpServiceDeps, { bot, settings }: McpPrepareParams) {
  const config = await mcpQueryConfig(deps, {
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('mcp'),
  });

  return deps.clients.actions.prepare({ botId: bot.id, config });
}
