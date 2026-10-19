import { mcpAuthActionCancel } from './mcp-auth-action.cancel';
import { mcpAuthActionCancelDevice } from './mcp-auth-action.cancel-device';
import { mcpAuthActionClose } from './mcp-auth-action.close';
import { mcpAuthActionComplete } from './mcp-auth-action.complete';
import { mcpAuthActionLogout } from './mcp-auth-action.logout';
import { mcpAuthActionStart } from './mcp-auth-action.start';
import { mcpAuthQueryStatus } from './mcp-auth-query.status';
import { mcpAuthProvider } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export function makeMcpAuthService({ credentials }: McpAuthTypes.McpAuthServiceDeps) {
  const deps: McpAuthTypes.McpAuthServiceState = {
    credentials,
    pending: new Map(),
    providers: new Map(),
    epochs: new Map(),
    saveEpochs: new Map(),
    writes: new Map(),
  };

  return {
    actions: {
      start: (params: McpAuthTypes.McpAuthStartParams) => mcpAuthActionStart(deps, params),
      complete: (params: McpAuthTypes.McpAuthCompleteParams) => mcpAuthActionComplete(deps, params),
      cancel: (params: McpAuthTypes.McpAuthDeviceParams) => mcpAuthActionCancel(deps, params),
      logout: (params: McpAuthTypes.McpAuthServerParams) => mcpAuthActionLogout(deps, params),
      cancelDevice: (params: McpAuthTypes.McpAuthCancelDeviceParams) => mcpAuthActionCancelDevice(deps, params),
    },
    queries: {
      status: (params: McpAuthTypes.McpAuthDeviceParams) => mcpAuthQueryStatus(deps, params),
    },
    provider: (params: McpAuthTypes.McpAuthServerParams) => mcpAuthProvider(deps, params),
    close: () => mcpAuthActionClose(deps),
  };
}

export type McpAuthService = ReturnType<typeof makeMcpAuthService>;
