import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function botQueryGet({ database }: BotServiceDeps, { botId }: BotGetInput) {
  const bot = await database.db.selectFrom('bot').selectAll().where('id', '=', botId).executeTakeFirst();

  return match(bot)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId });
    });
}
