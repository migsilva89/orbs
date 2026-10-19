import { botActionConfigure } from './bot-action.configure';
import { botActionCreate } from './bot-action.create';
import { botActionRestore } from './bot-action.restore';
import { botActionSwapModels } from './bot-action.swap-models';
import { botActionUpdate } from './bot-action.update';
import { botQueryCatalog } from './bot-query.catalog';
import { botQueryGet } from './bot-query.get';
import { botQueryInstructions } from './bot-query.instructions';
import { botQueryList } from './bot-query.list';
import { botQueryMcp } from './bot-query.mcp';
import { botQueryPlugins } from './bot-query.plugins';
import { botQuerySkills } from './bot-query.skills';
import type { BotChangeListener, BotServiceDeps } from '../../types/bot.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeBotService(deps: Omit<BotServiceDeps, 'configurations' | 'changes'>) {
  const serviceDeps: BotServiceDeps = { ...deps, configurations: new Map(), changes: new Set() };

  return {
    onChange: (listener: BotChangeListener) => {
      serviceDeps.changes.add(listener);
      return () => {
        serviceDeps.changes.delete(listener);
      };
    },
    actions: {
      configure: (params: UniversalTypes.BotGetInput) => botActionConfigure(serviceDeps, params),
      restore: () => botActionRestore(serviceDeps),
      create: (params: UniversalTypes.BotCreateInput) => botActionCreate(serviceDeps, params),
      swapModels: (params: UniversalTypes.BotSwapModelsInput) => botActionSwapModels(serviceDeps, params),
      update: (params: UniversalTypes.BotUpdateInput) => botActionUpdate(serviceDeps, params),
    },
    queries: {
      plugins: (params: UniversalTypes.BotGetInput) => botQueryPlugins(serviceDeps, params),
      instructions: (params: UniversalTypes.BotGetInput) => botQueryInstructions(serviceDeps, params),
      catalog: (params: UniversalTypes.BotGetInput) => botQueryCatalog(serviceDeps, params),
      skills: (params: UniversalTypes.BotGetInput) => botQuerySkills(serviceDeps, params),
      mcp: (params: UniversalTypes.BotGetInput) => botQueryMcp(serviceDeps, params),
      list: () => botQueryList(serviceDeps),
      get: (params: UniversalTypes.BotGetInput) => botQueryGet(serviceDeps, params),
    },
  };
}

export type BotService = ReturnType<typeof makeBotService>;
