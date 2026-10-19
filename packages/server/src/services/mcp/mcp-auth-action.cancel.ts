import { mcpAuthTarget } from './mcp-auth.utils';
import type { McpAuthServiceDeps, McpAuthTargetParams } from '../../types/mcp-auth.types';

export async function mcpAuthActionCancel(deps: McpAuthServiceDeps, params: McpAuthTargetParams) {
  const serverUrl = await mcpAuthTarget(deps, params);
  return deps.oauth.actions.cancel({ deviceId: params.deviceId, serverUrl });
}
