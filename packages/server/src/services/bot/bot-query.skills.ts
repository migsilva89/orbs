import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function botQuerySkills(deps: BotServiceDeps, params: BotGetInput) {
  const bot = await botQueryGet(deps, params);
  return deps.skill.queries.discover({ bot });
}
