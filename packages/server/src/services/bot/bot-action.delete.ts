import { log } from '@repo/logger/server';
import { match } from 'ts-pattern';
import { botQueryGet } from './bot-query.get';
import { botQueue } from './bot.utils';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function botActionDelete(deps: BotServiceDeps, { botId }: BotGetInput) {
  await botQueryGet(deps, { botId });

  await botQueue(deps, botId, async () => {
    await deps.database.db.deleteFrom('bot').where('id', '=', botId).execute();

    for (const listener of deps.changes) {
      listener();
    }

    const results = await Promise.allSettled([
      deps.runtime.actions.removeBot({ botId }),
      deps.mcp.actions.release({ botId }),
      deps.workspace.actions.removeDirectory({ botId }),
    ]);

    for (const result of results) {
      match(result)
        .with({ status: 'rejected' }, ({ reason }) => log.error({
          tag: 'bot',
          message: 'Cannot remove deleted bot files.',
          botId,
          error: reason,
        }))
        .with({ status: 'fulfilled' }, () => undefined)
        .exhaustive();
    }
  });
}
