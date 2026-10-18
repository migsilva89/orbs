import { botQueryGet } from './bot-query.get';
import type { BotServiceDeps } from '../../types/bot.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function botQueryCatalog(deps: BotServiceDeps, params: BotGetInput) {
  const bot = await botQueryGet(deps, params);

  const [skills, mcp, plugins, instructions] = await Promise.all([
    deps.skill.queries.discover({ bot }),
    deps.mcp.queries.discover({ bot }),
    deps.plugin.queries.discover({ bot }),
    deps.instruction.queries.discover({ bot }),
  ]);

  return { skills, mcp, plugins, instructions };
}
