import { botPreferenceNotify, botPreferenceRecord, botPreferenceScheduleExpiry } from './bot-preference.utils';
import { botQueryGet } from './bot-query.get';
import type { BotPreferencesUpdate, BotServiceDeps } from '../../types/bot.types';

export async function botActionSetPreferences(deps: BotServiceDeps, { botId, ...patch }: BotPreferencesUpdate) {
  await botQueryGet(deps, { botId });

  const values = {
    isPinned: botPreferenceFlag(patch.isPinned),
    isHidden: botPreferenceFlag(patch.isHidden),
    rank: patch.rank,
    sectionId: patch.sectionId,
    isMuted: botPreferenceFlag(patch.isMuted),
    mutedUntil: patch.mutedUntil,
    readThroughEntryId: patch.readThroughEntryId,
    whenBusy: patch.whenBusy,
    updatedAt: Date.now(),
  };

  const row = await deps.database.db.insertInto('botPreference')
    .values({ botId, ...values })
    .onConflict((conflict) => conflict.column('botId').doUpdateSet(values))
    .returningAll()
    .executeTakeFirstOrThrow();

  botPreferenceNotify(deps);
  await botPreferenceScheduleExpiry(deps);

  return botPreferenceRecord(row);

  function botPreferenceFlag(value: boolean | undefined) {
    return value === undefined ? undefined : Number(value);
  }
}
