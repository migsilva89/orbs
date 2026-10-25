import { readdir, realpath, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import { PLUGIN } from './plugin.constants';
import { pluginIsModule, pluginName, pluginResolve } from './plugin.utils';
import type * as PluginTypes from '../../types/plugin.types';

export async function pluginFilesScan({ root }: PluginTypes.PluginLoaderServiceDeps, params: PluginTypes.PluginLoadParams): Promise<PluginTypes.PluginScan> {
  const directory = join(root, 'agents', params.botId);
  const localPaths = [join(directory, '.pi/plugins'), join(directory, '.agents/plugins')];

  const sharedPaths = match(params.isInherited)
    .with(true, () => params.directories)
    .with(false, () => [])
    .exhaustive();

  const sources = await Promise.all([...localPaths, ...sharedPaths].map(async (source) => {
    const diagnostics: PluginTypes.PluginScan['diagnostics'] = [];
    const files = await pluginFiles(pluginResolve(root, source), diagnostics);
    return { files, diagnostics };
  }));

  const diagnostics = sources.flatMap((source) => source.diagnostics);
  const plugins: PluginTypes.PluginFile[] = [];
  const seen = new Set<string>();

  for (const path of sources.flatMap((source) => source.files)) {
    match(seen.has(path))
      .with(true, () => undefined)
      .with(false, () => {
        seen.add(path);
        plugins.push({ name: pluginName(path), path });
      })
      .exhaustive();
  }

  return { plugins, diagnostics };
}

async function pluginFiles(path: string, diagnostics: PluginTypes.PluginScan['diagnostics']): Promise<string[]> {
  try {
    const canonical = await realpath(path);
    const entry = await stat(canonical);

    return await match(entry.isDirectory())
      .with(false, async () => match(pluginIsModule(canonical))
        .with(true, () => [canonical])
        .with(false, () => [])
        .exhaustive())
      .with(true, async () => {
        const children = await readdir(canonical, { withFileTypes: true });

        const results = await Promise.all(children
          .filter((child) => !PLUGIN.skip.includes(child.name) && !child.name.startsWith('.'))
          .sort((left, right) => left.name.localeCompare(right.name))
          .map(async (child) => {
            const childPath = join(canonical, child.name);

            try {
              const isDirectory = child.isDirectory()
              || (child.isSymbolicLink() && (await stat(childPath)).isDirectory());

              const paths = await match(isDirectory)
                .with(true, async () => await pluginFilesIndex(childPath))
                .with(false, async () => match(pluginIsModule(child.name))
                  .with(true, async () => [await realpath(childPath)])
                  .with(false, () => [])
                  .exhaustive())
                .exhaustive();

              return { paths, issues: [] };
            } catch (error) {
              return {
                paths: [],
                issues: match(error)
                  .with({ code: 'ENOENT' }, () => [])
                  .otherwise(() => [{ path: childPath, message: PLUGIN.messages.read }]),
              };
            }
          }));

        diagnostics.push(...results.flatMap((result) => result.issues));

        return results.flatMap((result) => result.paths);
      })
      .exhaustive();
  } catch (error) {
    match(error)
      .with({ code: 'ENOENT' }, () => undefined)
      .otherwise(() => diagnostics.push({ path, message: PLUGIN.messages.read }));
    return [];
  }
}

async function pluginFilesIndex(directory: string): Promise<string[]> {
  const files = await Promise.all(PLUGIN.indexes.map(async (file) => {
    const path = join(directory, file);

    try {
      return [await realpath(path)];
    } catch (error) {
      return match(error)
        .with({ code: 'ENOENT' }, () => [])
        .otherwise(() => {
          throw error;
        });
    }
  }));

  return files.flat().slice(0, 1);
}
