import { skillQueryLoad } from './skill-query.load';
import { skillQuerySettings } from './skill-query.settings';
import type { SkillBotParams, SkillServiceDeps } from '../../types/skill.types';

export async function skillQueryDiscover(deps: SkillServiceDeps, params: SkillBotParams) {
  const settings = await skillQuerySettings(deps);
  const { skills } = skillQueryLoad(deps, { ...params, settings });
  return skills;
}
