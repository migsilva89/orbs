import { resourceActionConfigure } from './resource-action.configure';
import { resourceQueryDiscover } from './resource-query.discover';
import { resourceQuerySettings } from './resource-query.settings';
import type { ResourceBotParams, ResourceServiceDeps } from '../../types/resource.types';
import type { ResourceConfigureInput } from '@openbots/contracts/universal';

export function makeResourceService(deps: ResourceServiceDeps) {
  return {
    actions: {
      configure: (params: ResourceConfigureInput) => resourceActionConfigure(deps, params),
    },
    queries: {
      discover: (params: ResourceBotParams) => resourceQueryDiscover(deps, params),
      settings: () => resourceQuerySettings(deps),
    },
  };
}

export type ResourceService = ReturnType<typeof makeResourceService>;
