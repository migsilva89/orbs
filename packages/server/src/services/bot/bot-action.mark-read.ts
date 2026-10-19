import { botPreferenceRecord } from './bot-preference.utils';
import { botQueryGet } from './bot-query.get';
import type { BotMarkReadParams, BotServiceDeps } from '../../types/bot.types';

export async function botActionMarkRead(deps: BotServiceDeps, { botId, throughEntryId }: BotMarkReadParams) {
  await botQueryGet(deps, { botId });

  const row = await deps.database.db.insertInto('botPreference')
    .values({
      botId,
      readThroughEntryId: throughEntryId,
      updatedAt: Date.now(),
    })
    .onConflict((conflict) => conflict.column('botId').doUpdateSet((eb) => ({
      readThroughEntryId: eb.fn('max', [eb.ref('botPreference.readThroughEntryId'), eb.val(throughEntryId)]),
      updatedAt: Date.now(),
    })))
    .returningAll()
    .executeTakeFirstOrThrow();

  for (const listener of deps.changes) {
    listener();
  }

  return botPreferenceRecord(row);
}
