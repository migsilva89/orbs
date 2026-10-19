import { match } from 'ts-pattern';
import { mcpAuthAbort, mcpAuthBumpSave } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export function mcpAuthActionCancelDevice(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthCancelDeviceParams,
) {
  for (const session of deps.pending.values()) {
    match(session.deviceId)
      .with(params.deviceId, () => {
        mcpAuthBumpSave(deps, session.serverUrl);
        mcpAuthAbort(deps, session.serverUrl);
      })
      .otherwise(() => undefined);
  }
}
