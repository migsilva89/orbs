import { resourceQuerySettings } from './resource-query.settings';
import { resourceQuerySkills } from './resource-query.skills';
import type { ResourceBotParams, ResourceServiceDeps } from '../../types/resource.types';

export async function resourceQueryDiscover(deps: ResourceServiceDeps, { bot }: ResourceBotParams) {
  const settings = await resourceQuerySettings(deps);
  const { skills } = resourceQuerySkills(deps, { bot, settings });

  const mcp = await deps.driver.discoverMcp({
    botId: bot.id,
    mcpPaths: settings.mcpPaths,
    isInherited: bot.inherit.includes('mcp'),
  });

  return { skills, mcp };
}
