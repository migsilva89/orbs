import { pluginQuerySettings } from './plugin-query.settings';
import type { PluginBotParams, PluginServiceDeps } from '../../types/plugin.types';

export async function pluginQueryDiscover(deps: PluginServiceDeps, { bot }: PluginBotParams) {
  const settings = await pluginQuerySettings(deps);
  return deps.loader.queries.discover({
    botId: bot.id,
    directories: settings.directories,
    isInherited: bot.inherit.includes('plugins'),
  });
}
