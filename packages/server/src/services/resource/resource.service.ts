import { resourceActionConfigure } from './resource-action.configure';
import { resourceQueryDiscover } from './resource-query.discover';
import { resourceQuerySettings } from './resource-query.settings';
import { resourceQuerySkills } from './resource-query.skills';
import type { ResourceBotParams, ResourceBotSkillsParams, ResourceServiceDeps } from '../../types/resource.types';
import type { BotGetInput, ResourceConfigureInput } from '@openbots/contracts/universal';

export function makeResourceService(deps: ResourceServiceDeps) {
  return {
    actions: {
      prepareDirectory: (params: BotGetInput) => deps.driver.prepareDirectory(params),
      configure: (params: ResourceConfigureInput) => resourceActionConfigure(deps, params),
    },
    queries: {
      skills: (params: ResourceBotSkillsParams) => resourceQuerySkills(deps, params),
      discover: (params: ResourceBotParams) => resourceQueryDiscover(deps, params),
      settings: () => resourceQuerySettings(deps),
    },
  };
}

export type ResourceService = ReturnType<typeof makeResourceService>;
