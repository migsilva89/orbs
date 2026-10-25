import { createRegistry } from '@earendil-works/pi-durable';
import { pathToFileURL } from 'node:url';
import { match, P } from 'ts-pattern';
import { pluginExtension } from '../../types/plugin.types';
import { pluginFilesScan } from './plugin-files.utils';
import { PLUGIN } from './plugin.constants';
import type * as PluginTypes from '../../types/plugin.types';

export async function pluginActionLoad(
  deps: PluginTypes.PluginLoaderServiceDeps,
  params: PluginTypes.PluginLoadParams,
): Promise<PluginTypes.PluginLoadResult> {
  const { plugins, diagnostics } = await pluginFilesScan(deps, params);
  const loaded = await Promise.all(plugins.map((plugin) => pluginImport(plugin)));

  return {
    extensions: loaded.flatMap((entry) => entry.extension === undefined ? [] : [entry.extension]),
    diagnostics: [...diagnostics, ...loaded.flatMap((entry) => entry.diagnostic === undefined ? [] : [entry.diagnostic])],
  };

  async function pluginImport(plugin: PluginTypes.PluginFile) {
    const cached = deps.imports.get(plugin.path);

    return match(cached)
      .with(P.not(P.nullish), (extension) => ({ extension, diagnostic: undefined }))
      .otherwise(async () => {
        try {
          const imported = await import(pathToFileURL(plugin.path).href);

          return match(pluginExtension.safeParse(imported.default))
            .with({ success: true }, ({ data }) => {
              try {
                createRegistry().install(data);
                deps.imports.set(plugin.path, data);
                deps.failures.delete(plugin.path);

                return { extension: data, diagnostic: undefined };
              } catch {
                deps.failures.set(plugin.path, PLUGIN.messages.invalid);

                return { extension: undefined, diagnostic: { path: plugin.path, message: PLUGIN.messages.invalid } };
              }
            })
            .with({ success: false }, () => {
              deps.failures.set(plugin.path, PLUGIN.messages.invalid);

              return { extension: undefined, diagnostic: { path: plugin.path, message: PLUGIN.messages.invalid } };
            })
            .exhaustive();
        } catch {
          deps.failures.set(plugin.path, PLUGIN.messages.import);

          return { extension: undefined, diagnostic: { path: plugin.path, message: PLUGIN.messages.import } };
        }
      });
  }
}
