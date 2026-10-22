import { pluginActionConfigure } from './plugin-action.configure';
import { pluginActionLoad } from './plugin-action.load';
import { pluginQueryDiscover } from './plugin-query.discover';
import { pluginQuerySettings } from './plugin-query.settings';
import type { PluginBotParams, PluginLoadParams, PluginServiceDeps } from '../../types/plugin.types';
import type { PluginConfigureInput } from '@repo/contracts/universal';

export function makePluginService(deps: PluginServiceDeps) {
  return {
    actions: {
      configure: (params: PluginConfigureInput) => pluginActionConfigure(deps, params),
      load: (params: PluginLoadParams) => pluginActionLoad(deps, params),
    },
    queries: {
      settings: () => pluginQuerySettings(deps),
      discover: (params: PluginBotParams) => pluginQueryDiscover(deps, params),
    },
  };
}

export type PluginService = ReturnType<typeof makePluginService>;
