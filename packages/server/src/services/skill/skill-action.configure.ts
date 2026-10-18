import { match } from 'ts-pattern';
import { skillQuerySettings } from './skill-query.settings';
import { SKILL } from './skill.constants';
import type { SkillServiceDeps } from '../../types/skill.types';
import type { SkillConfigureInput } from '@openbots/contracts/universal';

export async function skillActionConfigure(deps: SkillServiceDeps, { directories }: SkillConfigureInput) {
  await match(directories)
    .with(undefined, () => undefined)
    .otherwise((value) => deps.settings.actions.set({
      records: [{
        key: SKILL.directoriesSetting,
        value: JSON.stringify(value),
      }],
    }));

  return skillQuerySettings(deps);
}
