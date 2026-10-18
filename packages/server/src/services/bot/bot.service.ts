import { botActionConfigure } from './bot-action.configure';
import { botActionCreate } from './bot-action.create';
import { botActionRestore } from './bot-action.restore';
import { botActionUpdate } from './bot-action.update';
import { botQueryCatalog } from './bot-query.catalog';
import { botQueryGet } from './bot-query.get';
import { botQueryInstructions } from './bot-query.instructions';
import { botQueryList } from './bot-query.list';
import { botQueryMcp } from './bot-query.mcp';
import { botQueryPlugins } from './bot-query.plugins';
import { botQuerySkills } from './bot-query.skills';
import type { BotChangeListener, BotServiceDeps } from '../../types/bot.types';
import type { BotCreateInput, BotGetInput, BotUpdateInput } from '@openbots/contracts/universal';

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
      configure: (params: BotGetInput) => botActionConfigure(serviceDeps, params),
      restore: () => botActionRestore(serviceDeps),
      create: (params: BotCreateInput) => botActionCreate(serviceDeps, params),
      update: (params: BotUpdateInput) => botActionUpdate(serviceDeps, params),
    },
    queries: {
      plugins: (params: BotGetInput) => botQueryPlugins(serviceDeps, params),
      instructions: (params: BotGetInput) => botQueryInstructions(serviceDeps, params),
      catalog: (params: BotGetInput) => botQueryCatalog(serviceDeps, params),
      skills: (params: BotGetInput) => botQuerySkills(serviceDeps, params),
      mcp: (params: BotGetInput) => botQueryMcp(serviceDeps, params),
      list: () => botQueryList(serviceDeps),
      get: (params: BotGetInput) => botQueryGet(serviceDeps, params),
    },
  };
}

export type BotService = ReturnType<typeof makeBotService>;
