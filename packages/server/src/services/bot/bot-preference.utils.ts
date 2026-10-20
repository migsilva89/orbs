import { match, P } from 'ts-pattern';
import { BOT } from './bot.constants';
import type { BotPreferenceRow, BotPreferences, BotServiceDeps } from '../../types/bot.types';

export function botPreferenceRecord(row: BotPreferenceRow | undefined, now = Date.now()): BotPreferences {
  const mutedUntil = row?.mutedUntil ?? null;

  return {
    isPinned: row?.isPinned === 1,
    isHidden: row?.isHidden === 1,
    rank: row?.rank ?? null,
    isMuted: row?.isMuted === 1 && (mutedUntil === null || mutedUntil > now),
    mutedUntil,
    readThroughEntryId: row?.readThroughEntryId ?? 0,
    whenBusy: row?.whenBusy ?? null,
  };
}

export function botPreferenceNotify(deps: BotServiceDeps) {
  for (const listener of deps.changes) {
    listener();
  }
}

export async function botPreferenceScheduleExpiry(deps: BotServiceDeps) {
  const next = await match(deps.changes.size)
    .with(0, () => undefined)
    .otherwise(() => deps.database.db.selectFrom('botPreference')
      .select((eb) => eb.fn.min('mutedUntil').as('at'))
      .where('isMuted', '=', 1)
      .where('mutedUntil', '>', Date.now())
      .executeTakeFirst());

  clearTimeout(deps.muteExpiry.timer);

  deps.muteExpiry.timer = match(next?.at)
    .with(P.number, (at) => setTimeout(() => {
      botPreferenceNotify(deps);
      void botPreferenceScheduleExpiry(deps);
    }, Math.min(Math.max(0, at - Date.now()), BOT.maxTimerDelayMs)))
    .otherwise(() => undefined);
}
