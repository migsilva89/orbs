import { match } from 'ts-pattern';
import { mcpAuthAbort, mcpAuthBump, mcpAuthCredentialKey, mcpAuthEnqueue, mcpAuthEpoch, mcpAuthServerUrl } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthActionLogout(deps: McpAuthTypes.McpAuthServiceState, params: McpAuthTypes.McpAuthServerParams) {
  const url = mcpAuthServerUrl(params.serverUrl);
  mcpAuthAbort(deps, url);
  mcpAuthBump(deps, url);

  const epoch = mcpAuthEpoch(deps, url);

  await mcpAuthEnqueue(deps, url, async () => {
    await match(mcpAuthEpoch(deps, url) === epoch)
      .with(false, async () => undefined)
      .with(true, async () => {
        await deps.credentials.actions.set({ key: mcpAuthCredentialKey(url), value: null });
      })
      .exhaustive();
  });
}
