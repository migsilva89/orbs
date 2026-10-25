import { match, P } from 'ts-pattern';
import { pluginFilesScan } from './plugin-files.utils';
import type { PluginLoaderServiceDeps, PluginLoadParams } from '../../types/plugin.types';
import type { PluginCatalog } from '@repo/contracts/universal';

export async function pluginQueryDiscover(
  deps: PluginLoaderServiceDeps,
  params: PluginLoadParams,
): Promise<PluginCatalog> {
  const { plugins, diagnostics } = await pluginFilesScan(deps, params);

  for (const plugin of plugins) {
    match(deps.failures.get(plugin.path))
      .with(P.string, (message) => diagnostics.push({ path: plugin.path, message }))
      .otherwise(() => undefined);
  }

  return { plugins, diagnostics };
}
