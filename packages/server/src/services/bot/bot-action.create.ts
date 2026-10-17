import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotCreateInput } from '@openbots/contracts/universal';

export async function botActionCreate({ database, runtime }: BotServiceDeps, params: BotCreateInput) {
  const now = Date.now();

  const saved = await database.db.insertInto('bot')
    .values({
      ...params,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    })
    .onConflict((conflict) => conflict.column('handle').doNothing())
    .returningAll().executeTakeFirst();

  const bot = match(saved)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.CONFLICT();
    });

  await runtime.actions.configureBot(bot);

  return bot;
}
