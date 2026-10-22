import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import type { PluginLoadParams, PluginServiceDeps } from '../../types/plugin.types';

export async function pluginActionLoad(deps: PluginServiceDeps, { bot, settings }: PluginLoadParams) {
  const result = await deps.loader.actions.load({
    botId: bot.id,
    directories: settings.directories,
    isInherited: bot.inherit.includes('plugins'),
  });

  return match(result.diagnostics.length)
    .with(0, () => result.extensions)
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({ fields: {
        plugins: { message: 'Cannot load configured plugins. Check the plugin catalog diagnostics.' },
      } });
    });
}
