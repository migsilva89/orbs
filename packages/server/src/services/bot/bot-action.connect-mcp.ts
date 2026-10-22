import { botActionConfigure } from './bot-action.configure';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function botActionConnectMcp(deps: BotServiceDeps, params: BotGetInput) {
  const bot = await botActionConfigure(deps, params);
  return deps.mcp.queries.discover({ bot });
}
