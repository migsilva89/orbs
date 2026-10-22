import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function botQueryInstructions(deps: BotServiceDeps, params: BotGetInput) {
  const bot = await botQueryGet(deps, params);
  return deps.instruction.queries.discover({ bot });
}
