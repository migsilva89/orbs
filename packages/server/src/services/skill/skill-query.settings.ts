import { skillSettings } from '@repo/contracts/universal';
import { SKILL } from './skill.constants';
import type { SkillServiceDeps } from '../../types/skill.types';

export async function skillQuerySettings({ settings }: SkillServiceDeps) {
  const stored = await settings.queries.get({ keys: [SKILL.directoriesSetting] });
  const record = stored.find(({ key }) => key === SKILL.directoriesSetting);

  return skillSettings.parse({
    directories: record === undefined ? SKILL.defaults.directories : JSON.parse(record.value),
  });
}
