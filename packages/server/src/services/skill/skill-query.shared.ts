import { skillQueryLoad } from './skill-query.load';
import { skillQuerySettings } from './skill-query.settings';
import type { SkillBotParams, SkillServiceDeps } from '../../types/skill.types';

export async function skillQueryShared(deps: SkillServiceDeps, { bot }: SkillBotParams) {
  const settings = await skillQuerySettings(deps);

  const { skills } = skillQueryLoad(deps, {
    bot: { ...bot, inherit: ['skills'], sharedSkills: null },
    settings,
  });

  return skills.filter((skill) => skill.isShared);
}
