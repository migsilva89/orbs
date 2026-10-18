import { pluginSettings } from '@openbots/contracts/universal';
import { PLUGIN } from './plugin.constants';
import type { PluginServiceDeps } from '../../types/plugin.types';

export async function pluginQuerySettings({ settings }: PluginServiceDeps) {
  const stored = await settings.queries.get({ keys: [PLUGIN.directoriesSetting] });
  const record = stored.find(({ key }) => key === PLUGIN.directoriesSetting);

  return pluginSettings.parse({
    directories: record === undefined ? PLUGIN.defaults.directories : JSON.parse(record.value),
  });
}
