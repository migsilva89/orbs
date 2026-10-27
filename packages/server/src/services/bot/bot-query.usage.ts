import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function botQueryUsage(deps: BotServiceDeps, params: BotGetInput) {
  await botQueryGet(deps, params);

  return deps.runtime.queries.botUsage(params);
}
