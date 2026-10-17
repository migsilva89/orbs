import type { ResourceBotSkillsParams, ResourceServiceDeps } from '../../types/resource.types';

export function resourceQuerySkills({ driver }: ResourceServiceDeps, { bot, settings }: ResourceBotSkillsParams) {
  return driver.loadSkills({
    botId: bot.id,
    skillDirs: settings.skillDirs,
    isInherited: bot.inherit.includes('skills'),
  });
}
