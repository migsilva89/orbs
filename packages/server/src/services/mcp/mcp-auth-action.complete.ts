import { mcpAuthTarget } from './mcp-auth.utils';
import type { McpAuthCompleteParams, McpAuthServiceDeps } from '../../types/mcp-auth.types';

export async function mcpAuthActionComplete(deps: McpAuthServiceDeps, params: McpAuthCompleteParams) {
  const serverUrl = await mcpAuthTarget(deps, params);

  const result = await deps.oauth.actions.complete({
    deviceId: params.deviceId,
    serverUrl,
    callbackUrl: params.callbackUrl,
  });

  await deps.bots.actions.configure({ botId: params.botId });

  return result;
}
