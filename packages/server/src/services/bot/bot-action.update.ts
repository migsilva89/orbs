import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotUpdateInput } from '@openbots/contracts/universal';

export async function botActionUpdate({ database, runtime }: BotServiceDeps, { botId, ...changes }: BotUpdateInput) {
  const bot = await database.db.transaction().execute(async (tx) => {
    const duplicate = await tx.selectFrom('bot').select('id')
      .where('handle', '=', changes.handle ?? '').where('id', '!=', botId).executeTakeFirst();

    match(duplicate).with(P.nonNullable, () => {
      throw new Errors.CONFLICT();
    }).otherwise(() => undefined);

    const saved = await tx.updateTable('bot').set({ ...changes, updatedAt: Date.now() })
      .where('id', '=', botId).returningAll().executeTakeFirst();

    return match(saved)
      .with(P.nonNullable, (value) => value)
      .otherwise(() => {
        throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId });
      });
  });

  await runtime.actions.configureBot(bot);

  return bot;
}
