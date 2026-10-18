import { mcpActionConnect } from './mcp-action.connect';
import type { McpClientParams, McpClientServiceDeps } from '../../types/mcp.types';

export async function mcpActionPrepare(deps: McpClientServiceDeps, { botId, config }: McpClientParams) {
  const enabled = config.servers.filter(({ config: server }) => server.enabled !== false && server.disabled !== true);
  const keys = new Set(enabled.map(({ name }) => `${botId}:${name}`));

  const removed = [...deps.connections].filter(([key]) => key.startsWith(`${botId}:`) && !keys.has(key));

  await Promise.all(removed.map(async ([key, connection]) => {
    deps.connections.delete(key);
    await connection.client.close();
    await connection.ready;
  }));

  const tools = await Promise.all(enabled.map((entry) => mcpActionConnect(deps, { botId, entry })));
  return tools.flat();
}
