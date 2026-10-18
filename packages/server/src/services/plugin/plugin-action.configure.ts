import { match } from 'ts-pattern';
import { pluginQuerySettings } from './plugin-query.settings';
import { PLUGIN } from './plugin.constants';
import type { PluginServiceDeps } from '../../types/plugin.types';
import type { PluginConfigureInput } from '@openbots/contracts/universal';

export async function pluginActionConfigure(deps: PluginServiceDeps, { directories }: PluginConfigureInput) {
  await match(directories)
    .with(undefined, () => undefined)
    .otherwise((value) => deps.settings.actions.set({
      records: [{
        key: PLUGIN.directoriesSetting,
        value: JSON.stringify(value),
      }],
    }));

  return pluginQuerySettings(deps);
}
