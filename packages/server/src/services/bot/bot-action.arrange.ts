import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import type { BotArrangeParams, BotServiceDeps } from '../../types/bot.types';

export async function botActionArrange(deps: BotServiceDeps, { botIds, isPinned, sectionId }: BotArrangeParams) {
  await deps.database.db.transaction().execute(async (tx) => {
    const [found, section] = await Promise.all([
      tx.selectFrom('bot').select('id').where('id', 'in', match(botIds).with([], () => ['']).otherwise((ids) => ids)).execute(),
      sectionId === undefined || sectionId === null ? undefined : tx.selectFrom('sidebarSection').select('id').where('id', '=', sectionId).executeTakeFirst(),
    ]);

    match(found.length === botIds.length && (sectionId === undefined || sectionId === null || section?.id === sectionId))
      .with(true, () => undefined)
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: sectionId && !section ? 'sidebar section' : 'bot' });
      })
      .exhaustive();

    const now = Date.now();
    await Promise.all(botIds.map((botId, rank) => {
      const updates = { rank, sectionId, isPinned: Number(isPinned), updatedAt: now };

      return tx.insertInto('botPreference')
        .values({ botId, ...updates })
        .onConflict((conflict) => conflict.column('botId').doUpdateSet(updates))
        .execute();
    }));
  });

  for (const listener of deps.changes) {
    listener();
  }
}
