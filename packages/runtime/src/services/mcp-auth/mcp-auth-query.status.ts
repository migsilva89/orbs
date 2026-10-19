import { match, P } from 'ts-pattern';
import { MCP_AUTH } from './mcp-auth.constants';
import { mcpAuthRecordRead, mcpAuthServerUrl } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthQueryStatus(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthDeviceParams,
): Promise<McpAuthTypes.McpAuthStatusResult> {
  const url = mcpAuthServerUrl(params.serverUrl);
  const pending = deps.pending.get(url);

  return await match(pending)
    .with(P.when((session) => session?.deviceId === params.deviceId && Date.now() - session.createdAt < MCP_AUTH.pendingTtlMs), () => ({
      status: 'pending' as const,
    }))
    .otherwise(async () => {
      const record = await mcpAuthRecordRead(deps, url);

      return match(record?.tokens?.access_token)
        .with(P.string, () => ({ status: 'authorized' as const }))
        .otherwise(() => ({ status: 'idle' as const }));
    });
}
