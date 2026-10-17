import { resourceQuerySettings } from './resource-query.settings';
import type { ResourceBotParams, ResourceServiceDeps } from '../../types/resource.types';

export async function resourceQueryDiscover(deps: ResourceServiceDeps, { bot }: ResourceBotParams) {
  const settings = await resourceQuerySettings(deps);

  const { skills } = deps.skill.queries.load({
    botId: bot.id,
    skillDirs: settings.skillDirs,
    isInherited: bot.inherit.includes('skills'),
  });

  const mcp = await deps.mcp.queries.catalog({
    botId: bot.id,
    mcpPaths: settings.mcpPaths,
    isInherited: bot.inherit.includes('mcp'),
  });

  return { skills, mcp };
}
