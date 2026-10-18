import type { SettingsGetParams, SettingsServiceDeps } from '../../types/settings.types';

export async function settingsQueryGet({ database }: SettingsServiceDeps, { keys }: SettingsGetParams) {
  return database.db.selectFrom('settings').select(['key', 'value']).where('key', 'in', keys).execute();
}
