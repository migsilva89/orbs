import { mcpActionPrepare } from './mcp-action.prepare';
import { mcpQueryCatalog } from './mcp-query.catalog';
import type { McpServiceDeps } from '../../types/mcp.types';
import type { McpParams } from '@openbots/server/server';

export function makeMcpService({ root }: Pick<McpServiceDeps, 'root'>) {
  const deps: McpServiceDeps = { root, connections: new Map() };

  return {
    actions: {
      prepare: (params: McpParams) => mcpActionPrepare(deps, params),
    },
    queries: {
      catalog: (params: McpParams) => mcpQueryCatalog(deps, params),
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

export type McpService = ReturnType<typeof makeMcpService>;
