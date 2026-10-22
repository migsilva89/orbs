import { mcpAuthActionCallback } from './mcp-auth-action.callback';
import { mcpAuthActionCancel } from './mcp-auth-action.cancel';
import { mcpAuthActionComplete } from './mcp-auth-action.complete';
import { mcpAuthActionLogout } from './mcp-auth-action.logout';
import { mcpAuthActionStart } from './mcp-auth-action.start';
import { mcpAuthQueryStatus } from './mcp-auth-query.status';
import type * as McpAuthTypes from '../../types/mcp-auth.types';
import type { McpAuthTarget } from '@repo/contracts/universal';
import type { McpAuthCallbackParams } from '@repo/runtime/server';

export function makeMcpAuthService(deps: McpAuthTypes.McpAuthServiceDeps) {
  return {
    actions: {
      start: (params: McpAuthTypes.McpAuthStartParams) => mcpAuthActionStart(deps, params),
      complete: (params: McpAuthTypes.McpAuthCompleteParams) => mcpAuthActionComplete(deps, params),
      callback: (params: McpAuthCallbackParams) => mcpAuthActionCallback(deps, params),
      cancel: (params: McpAuthTypes.McpAuthTargetParams) => mcpAuthActionCancel(deps, params),
      logout: (params: McpAuthTarget) => mcpAuthActionLogout(deps, params),
    },
    queries: {
      status: (params: McpAuthTypes.McpAuthTargetParams) => mcpAuthQueryStatus(deps, params),
    },
  };
}

export type McpAuthService = ReturnType<typeof makeMcpAuthService>;
