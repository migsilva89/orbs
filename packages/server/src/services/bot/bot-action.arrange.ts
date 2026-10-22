import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import type { BotArrangeParams, BotServiceDeps } from '../../types/bot.types';

export async function botActionArrange(deps: BotServiceDeps, { botIds }: BotArrangeParams) {
  await deps.database.db.transaction().execute(async (tx) => {
    const found = await tx.selectFrom('bot').select('id').where('id', 'in', match(botIds).with([], () => ['']).otherwise((ids) => ids)).execute();

    match(found.length === botIds.length)
      .with(true, () => undefined)
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: 'bot' });
      })
      .exhaustive();

    const now = Date.now();
    await tx.updateTable('botPreference').set({ rank: null, updatedAt: now }).execute();

    await Promise.all(botIds.map((botId, rank) => tx.insertInto('botPreference')
      .values({
        botId,
        rank,
        updatedAt: now,
      })
      .onConflict((conflict) => conflict.column('botId').doUpdateSet({ rank, updatedAt: now }))
      .execute()));
  });

  for (const listener of deps.changes) {
    listener();
  }
}
