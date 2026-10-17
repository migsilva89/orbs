import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { botRecord } from './bot.utils';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function botActionConfigure(
  { database, runtime, resources }: BotServiceDeps,
  { botId }: BotGetInput,
) {
  const settings = await resources.queries.settings();

  return database.db.transaction().execute(async (tx) => {
    const row = await tx.selectFrom('bot').selectAll().where('id', '=', botId).executeTakeFirst();

    const bot = match(row)
      .with(P.nonNullable, botRecord)
      .otherwise(() => {
        throw new Errors.NOT_FOUND({ resource: 'bot', resourceId: botId });
      });

    await resources.actions.prepareDirectory({ botId: bot.id });

    const { prompt: skillsPrompt } = resources.queries.skills({ bot, settings });

    await runtime.actions.configureBot({ ...bot, skillsPrompt });

    return bot;
  });
}
