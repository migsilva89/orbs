import { skillQueryLoad } from './skill-query.load';
import type { SkillServiceDeps } from '../../types/skill.types';
import type { SkillLoadParams } from '@openbots/server/server';

export function makeSkillService(deps: SkillServiceDeps) {
  return {
    queries: {
      load: (params: SkillLoadParams) => skillQueryLoad(deps, params),
    },
  };
}

export type SkillService = ReturnType<typeof makeSkillService>;
