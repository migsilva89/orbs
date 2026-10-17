import { botActionConfigure } from './bot-action.configure';
import { botActionCreate } from './bot-action.create';
import { botActionRestore } from './bot-action.restore';
import { botActionUpdate } from './bot-action.update';
import { botQueryGet } from './bot-query.get';
import { botQueryList } from './bot-query.list';
import { botQueryResources } from './bot-query.resources';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotCreateInput, BotGetInput, BotUpdateInput } from '@openbots/contracts/universal';

export function makeBotService(deps: BotServiceDeps) {
  return {
    actions: {
      configure: (params: BotGetInput) => botActionConfigure(deps, params),
      restore: () => botActionRestore(deps),
      create: (params: BotCreateInput) => botActionCreate(deps, params),
      update: (params: BotUpdateInput) => botActionUpdate(deps, params),
    },
    queries: {
      resources: (params: BotGetInput) => botQueryResources(deps, params),
      models: () => deps.runtime.queries.models(),
      list: () => botQueryList(deps),
      get: (params: BotGetInput) => botQueryGet(deps, params),
    },
  };
}

export type BotService = ReturnType<typeof makeBotService>;
