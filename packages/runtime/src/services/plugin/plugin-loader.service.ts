import { pluginActionLoad } from './plugin-action.load';
import { pluginQueryDiscover } from './plugin-query.discover';
import type { PluginLoaderServiceDeps, PluginLoadParams } from '../../types/plugin.types';

export function makePluginLoaderService({ root }: Pick<PluginLoaderServiceDeps, 'root'>) {
  const deps: PluginLoaderServiceDeps = {
    root,
    imports: new Map(),
    failures: new Map(),
  };

  return {
    actions: {
      load: (params: PluginLoadParams) => pluginActionLoad(deps, params),
    },
    queries: {
      discover: (params: PluginLoadParams) => pluginQueryDiscover(deps, params),
    },
  };
}

export type PluginLoaderService = ReturnType<typeof makePluginLoaderService>;
