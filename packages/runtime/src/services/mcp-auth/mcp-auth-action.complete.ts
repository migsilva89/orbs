import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpAuthCallbackExchange } from './mcp-auth-callback.utils';
import { mcpAuthPrune, mcpAuthServerUrl } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthActionComplete(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthCompleteParams,
): Promise<McpAuthTypes.McpAuthCompleteResult> {
  const url = mcpAuthServerUrl(params.serverUrl);
  mcpAuthPrune(deps);

  return await match(deps.pending.get(url))
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'mcp-auth' });
    })
    .with({ deviceId: P.not(params.deviceId) }, () => {
      throw new Errors.FORBIDDEN();
    })
    .otherwise((session) => mcpAuthCallbackExchange(deps, url, session, params.callbackUrl));
}
