import type { SettingsRecord, SettingsServiceDeps } from '../../types/settings.types';

export async function settingsActionEnsure({ database }: SettingsServiceDeps, record: SettingsRecord) {
  await database.db.insertInto('settings')
    .values({ ...record, updatedAt: Date.now() })
    .onConflict((conflict) => conflict.column('key').doNothing())
    .execute();

  return database.db.selectFrom('settings').select(['key', 'value'])
    .where('key', '=', record.key).executeTakeFirstOrThrow();
}
