import { mcpActionConfigure } from './mcp-action.configure';
import { mcpActionPrepare } from './mcp-action.prepare';
import { mcpQueryDiscover } from './mcp-query.discover';
import { mcpQuerySettings } from './mcp-query.settings';
import type { McpBotParams, McpPrepareParams, McpServiceDeps } from '../../types/mcp.types';
import type { McpConfigureInput } from '@openbots/contracts/universal';

export function makeMcpService(deps: McpServiceDeps) {
  return {
    actions: {
      configure: (params: McpConfigureInput) => mcpActionConfigure(deps, params),
      prepare: (params: McpPrepareParams) => mcpActionPrepare(deps, params),
    },
    queries: {
      settings: () => mcpQuerySettings(deps),
      discover: (params: McpBotParams) => mcpQueryDiscover(deps, params),
    },
  };
}

export type McpService = ReturnType<typeof makeMcpService>;
