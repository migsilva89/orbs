import { mcpAuthTarget } from './mcp-auth.utils';
import type { McpAuthServiceDeps, McpAuthStartParams } from '../../types/mcp-auth.types';

export async function mcpAuthActionStart(deps: McpAuthServiceDeps, params: McpAuthStartParams) {
  const serverUrl = await mcpAuthTarget(deps, params);
  await deps.auth.queries.authenticate({ authorization: params.authorization });

  return deps.oauth.actions.start({
    deviceId: params.deviceId,
    serverUrl,
    redirectUrl: params.redirectUrl,
  });
}
