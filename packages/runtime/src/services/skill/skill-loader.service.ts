import { skillQueryExpand } from './skill-query.expand';
import { skillQueryLoad } from './skill-query.load';
import type { SkillExpandParams, SkillLoaderServiceDeps, SkillLoadParams } from '../../types/skill.types';

export function makeSkillLoaderService({ root }: Pick<SkillLoaderServiceDeps, 'root'>) {
  const deps: SkillLoaderServiceDeps = { root, catalogs: new Map() };

  return {
    queries: {
      load: (params: SkillLoadParams) => skillQueryLoad(deps, params),
      expand: (params: SkillExpandParams) => skillQueryExpand(deps, params),
    },
  };
}

export type SkillLoaderService = ReturnType<typeof makeSkillLoaderService>;
