import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpAuthAbort, mcpAuthBumpSave, mcpAuthPrune, mcpAuthServerUrl } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export function mcpAuthActionCancel(deps: McpAuthTypes.McpAuthServiceState, params: McpAuthTypes.McpAuthDeviceParams) {
  const url = mcpAuthServerUrl(params.serverUrl);
  mcpAuthPrune(deps);

  match(deps.pending.get(url))
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'mcp-auth' });
    })
    .with({ deviceId: P.not(params.deviceId) }, () => {
      throw new Errors.FORBIDDEN();
    })
    .otherwise(() => {
      mcpAuthBumpSave(deps, url);
      mcpAuthAbort(deps, url);
    });
}
