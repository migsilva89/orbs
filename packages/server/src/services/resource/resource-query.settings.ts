import { resourceSettings } from '@openbots/contracts/universal';
import { RESOURCE } from './resource.constants';
import type { ResourceServiceDeps } from '../../types/resource.types';

export async function resourceQuerySettings({ database }: ResourceServiceDeps) {
  const settings = await database.db.selectFrom('settings').select(['key', 'value'])
    .where('key', 'in', Object.keys(RESOURCE.defaults).map((key) => `${RESOURCE.settingsPrefix}${key}`)).execute();

  return resourceSettings.parse({
    ...RESOURCE.defaults,
    ...Object.fromEntries(settings.map(({ key, value }) => [
      key.slice(RESOURCE.settingsPrefix.length),
      JSON.parse(value),
    ])),
  });
}
