import { botActionConfigure } from './bot-action.configure';
import { botQueryList } from './bot-query.list';
import type { BotServiceDeps } from '../../types/bot.types';

export async function botActionRestore(deps: BotServiceDeps) {
  const bots = await botQueryList(deps);
  await Promise.all(bots.map((bot) => botActionConfigure(deps, { botId: bot.id })));
}
