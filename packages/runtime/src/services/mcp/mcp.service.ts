import { mcpActionPrepare } from './mcp-action.prepare';
import { mcpQueryCatalog } from './mcp-query.catalog';
import type { McpClientParams, McpClientServiceDeps } from '../../types/mcp.types';

export function makeMcpClientService({ root }: Pick<McpClientServiceDeps, 'root'>) {
  const deps: McpClientServiceDeps = { root, connections: new Map() };

  return {
    actions: {
      prepare: (params: McpClientParams) => mcpActionPrepare(deps, params),
    },
    queries: {
      catalog: (params: McpClientParams) => mcpQueryCatalog(deps, params),
    },
    close: async () => {
      const connections = [...deps.connections.values()];
      deps.connections.clear();
      await Promise.all(connections.map(async ({ client, ready }) => {
        await client.close();
        await ready;
      }));
    },
  };
}

export type McpClientService = ReturnType<typeof makeMcpClientService>;
