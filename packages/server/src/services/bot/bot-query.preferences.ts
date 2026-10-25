import { botPreferenceRecord } from './bot-preference.utils';
import type { BotDatabaseDeps, BotPreferences } from '../../types/bot.types';

export async function botQueryPreferences({ database }: BotDatabaseDeps): Promise<Map<string, BotPreferences>> {
  const rows = await database.db.selectFrom('bot')
    .leftJoin('botPreference', 'botPreference.botId', 'bot.id')
    .select([
      'bot.id',
      'botPreference.isPinned',
      'botPreference.isHidden',
      'botPreference.rank',
      'botPreference.sectionId',
      'botPreference.isMuted',
      'botPreference.mutedUntil',
      'botPreference.readThroughEntryId',
      'botPreference.whenBusy',
    ])
    .execute();

  return new Map(rows.map(({ id, ...row }) => [id, botPreferenceRecord(row)]));
}
