import { match } from 'ts-pattern';
import { resourceQuerySettings } from './resource-query.settings';
import { RESOURCE } from './resource.constants';
import type { ResourceServiceDeps } from '../../types/resource.types';
import type { ResourceConfigureInput } from '@openbots/contracts/universal';

export async function resourceActionConfigure(deps: ResourceServiceDeps, params: ResourceConfigureInput) {
  const settings = Object.entries<string[] | undefined>(params)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => ({
      key: `${RESOURCE.settingsPrefix}${key}`,
      value: JSON.stringify(value),
      updatedAt: Date.now(),
    }));

  await match(settings.length)
    .when((length) => length > 0, () => deps.database.db.insertInto('settings').values(settings)
      .onConflict((conflict) => conflict.column('key').doUpdateSet((expression) => ({
        value: expression.ref('excluded.value'),
        updatedAt: expression.ref('excluded.updatedAt'),
      }))).execute())
    .otherwise(() => undefined);

  return resourceQuerySettings(deps);
}
