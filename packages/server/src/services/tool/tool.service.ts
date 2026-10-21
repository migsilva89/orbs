import { toolActionAllowAlways } from './tool-action.allow-always';
import { toolActionAuthorize } from './tool-action.authorize';
import { toolActionConfigure } from './tool-action.configure';
import { toolQueryAlwaysAllowed } from './tool-query.always-allowed';
import { toolQuerySettings } from './tool-query.settings';
import { TOOL } from './tool.constants';
import type { ToolAllowAlwaysParams, ToolAlwaysAllowedParams, ToolServiceDeps } from '../../types/tool.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolConfigureInput } from '@openbots/contracts/universal';
import type { RuntimeToolCall } from '@openbots/runtime/server';

export function makeToolService(deps: ToolServiceDeps) {
  return {
    authorize: (call: RuntimeToolCall, context: Context) => toolActionAuthorize(deps, { ...call, context }),
    approvalTimeoutMs: async () => (await toolQuerySettings(deps)).approvalTimeoutMinutes * TOOL.minuteMs,
    actions: {
      configure: (params: ToolConfigureInput) => toolActionConfigure(deps, params),
      allowAlways: (params: ToolAllowAlwaysParams) => toolActionAllowAlways(deps, params),
    },
    queries: {
      settings: () => toolQuerySettings(deps),
      alwaysAllowed: (params: ToolAlwaysAllowedParams) => toolQueryAlwaysAllowed(deps, params),
    },
  };
}

export type ToolService = ReturnType<typeof makeToolService>;
