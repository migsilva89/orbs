import { botActionConfigure } from './bot-action.configure';
import { botQueryGet } from './bot-query.get';
import { botQueue } from './bot.utils';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function botActionClearHistory(deps: BotServiceDeps, { botId }: BotGetInput) {
  await botQueryGet(deps, { botId });
  await botQueue(deps, botId, () => deps.runtime.actions.clearBot({ botId }));

  return botActionConfigure(deps, { botId });
}
