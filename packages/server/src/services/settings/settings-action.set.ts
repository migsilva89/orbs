import { match } from 'ts-pattern';
import type { SettingsServiceDeps, SettingsSetParams } from '../../types/settings.types';

export async function settingsActionSet({ database }: SettingsServiceDeps, { records }: SettingsSetParams) {
  const settings = records.map(({ key, value }) => ({
    key,
    value,
    updatedAt: Date.now(),
  }));

  await match(settings.length)
    .when((length) => length > 0, () => database.db.insertInto('settings').values(settings)
      .onConflict((conflict) => conflict.column('key').doUpdateSet((expression) => ({
        value: expression.ref('excluded.value'),
        updatedAt: expression.ref('excluded.updatedAt'),
      }))).execute())
    .otherwise(() => undefined);
}
