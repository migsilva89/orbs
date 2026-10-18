import { botActionConfigure } from './bot-action.configure';
import { botActionCreate } from './bot-action.create';
import { botActionRestore } from './bot-action.restore';
import { botActionUpdate } from './bot-action.update';
import { botQueryCatalog } from './bot-query.catalog';
import { botQueryGet } from './bot-query.get';
import { botQueryList } from './bot-query.list';
import { botQueryMcp } from './bot-query.mcp';
import { botQuerySkills } from './bot-query.skills';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotCreateInput, BotGetInput, BotUpdateInput } from '@openbots/contracts/universal';

export function makeBotService(deps: Omit<BotServiceDeps, 'configurations'>) {
  const serviceDeps: BotServiceDeps = { ...deps, configurations: new Map() };

  return {
    actions: {
      configure: (params: BotGetInput) => botActionConfigure(serviceDeps, params),
      restore: () => botActionRestore(serviceDeps),
      create: (params: BotCreateInput) => botActionCreate(serviceDeps, params),
      update: (params: BotUpdateInput) => botActionUpdate(serviceDeps, params),
    },
    queries: {
      catalog: (params: BotGetInput) => botQueryCatalog(serviceDeps, params),
      skills: (params: BotGetInput) => botQuerySkills(serviceDeps, params),
      mcp: (params: BotGetInput) => botQueryMcp(serviceDeps, params),
      models: () => serviceDeps.runtime.queries.models(),
      list: () => botQueryList(serviceDeps),
      get: (params: BotGetInput) => botQueryGet(serviceDeps, params),
    },
  };
}

export type BotService = ReturnType<typeof makeBotService>;
