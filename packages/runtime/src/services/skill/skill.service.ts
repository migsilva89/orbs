import { skillQueryLoad } from './skill-query.load';
import type { SkillLoaderServiceDeps, SkillLoadParams } from '../../types/skill.types';

export function makeSkillLoaderService(deps: SkillLoaderServiceDeps) {
  return {
    queries: {
      load: (params: SkillLoadParams) => skillQueryLoad(deps, params),
    },
  };
}

export type SkillLoaderService = ReturnType<typeof makeSkillLoaderService>;
