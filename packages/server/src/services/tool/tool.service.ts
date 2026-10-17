import { toolActionAuthorize } from './tool-action.authorize';
import { toolActionConfigure } from './tool-action.configure';
import { toolQuerySettings } from './tool-query.settings';
import type { ToolServiceDeps } from '../../types/tool.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolConfigureInput } from '@openbots/contracts/universal';
import type { RuntimeToolCall } from '@openbots/runtime/server';

export function makeToolService(deps: ToolServiceDeps) {
  return {
    authorize: (call: RuntimeToolCall, context: Context) => toolActionAuthorize(deps, { ...call, context }),
    actions: {
      configure: (params: ToolConfigureInput) => toolActionConfigure(deps, params),
    },
    queries: {
      settings: () => toolQuerySettings(deps),
    },
  };
}

export type ToolService = ReturnType<typeof makeToolService>;
