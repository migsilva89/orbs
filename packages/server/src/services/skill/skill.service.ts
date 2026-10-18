import { skillActionConfigure } from './skill-action.configure';
import { skillQueryDiscover } from './skill-query.discover';
import { skillQueryLoad } from './skill-query.load';
import { skillQuerySettings } from './skill-query.settings';
import type { SkillBotParams, SkillLoadParams, SkillServiceDeps } from '../../types/skill.types';
import type { SkillConfigureInput } from '@openbots/contracts/universal';

export function makeSkillService(deps: SkillServiceDeps) {
  return {
    actions: {
      configure: (params: SkillConfigureInput) => skillActionConfigure(deps, params),
    },
    queries: {
      settings: () => skillQuerySettings(deps),
      load: (params: SkillLoadParams) => skillQueryLoad(deps, params),
      discover: (params: SkillBotParams) => skillQueryDiscover(deps, params),
    },
  };
}

export type SkillService = ReturnType<typeof makeSkillService>;
