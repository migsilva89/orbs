import { activityQueryList } from './activity-query.list';
import { activityQueryRun } from './activity-query.run';
import type { ActivityServiceDeps } from '../../types/activity.types';
import type * as UniversalTypes from '@repo/contracts/universal';

export function makeActivityService(deps: ActivityServiceDeps) {
  return {
    queries: {
      list: (params: UniversalTypes.ActivityListInput) => activityQueryList(deps, params),
      run: (params: UniversalTypes.ActivityRunGetInput) => activityQueryRun(deps, params),
    },
  };
}

export type ActivityService = ReturnType<typeof makeActivityService>;
