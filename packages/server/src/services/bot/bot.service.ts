import { botActionCreate } from './bot-action.create';
import { botActionUpdate } from './bot-action.update';
import { botQueryGet } from './bot-query.get';
import { botQueryList } from './bot-query.list';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotCreateInput, BotGetInput, BotUpdateInput } from '@openbots/contracts/universal';

export function makeBotService(deps: BotServiceDeps) {
  return {
    actions: {
      create: (params: BotCreateInput) => botActionCreate(deps, params),
      update: (params: BotUpdateInput) => botActionUpdate(deps, params),
    },
    queries: {
      list: () => botQueryList(deps),
      get: (params: BotGetInput) => botQueryGet(deps, params),
    },
  };
}

export type BotService = ReturnType<typeof makeBotService>;
