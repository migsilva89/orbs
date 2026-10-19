import { mcpAuthTarget } from './mcp-auth.utils';
import type { McpAuthServiceDeps, McpAuthTargetParams } from '../../types/mcp-auth.types';

export async function mcpAuthQueryStatus(deps: McpAuthServiceDeps, params: McpAuthTargetParams) {
  const serverUrl = await mcpAuthTarget(deps, params);
  return deps.oauth.queries.status({ deviceId: params.deviceId, serverUrl });
}
