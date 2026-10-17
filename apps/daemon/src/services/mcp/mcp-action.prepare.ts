import { mcpActionConnect } from './mcp-action.connect';
import { mcpQueryConfig } from './mcp-query.config';
import type { McpServiceDeps } from '../../types/mcp.types';
import type { McpParams } from '@openbots/server/server';

export async function mcpActionPrepare(deps: McpServiceDeps, params: McpParams) {
  const { servers } = await mcpQueryConfig(deps, params);
  const enabled = servers.filter(({ config }) => config.enabled !== false && config.disabled !== true);
  const keys = new Set(enabled.map(({ name }) => `${params.botId}:${name}`));

  const removed = [...deps.connections].filter(([key]) => key.startsWith(`${params.botId}:`) && !keys.has(key));

  await Promise.all(removed.map(async ([key, connection]) => {
    deps.connections.delete(key);
    await connection.client.close();
    await connection.ready;
  }));

  const tools = await Promise.all(enabled.map((entry) => mcpActionConnect(deps, { botId: params.botId, entry })));
  return tools.flat();
}
