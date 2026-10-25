import { activityQueryList } from './activity-query.list';
import { activityQueryRun } from './activity-query.run';
import type * as ActivityTypes from '../../types/activity.types';
import type { Context } from '@earendil-works/chord/context';

export function makeActivityService(deps: ActivityTypes.ActivityServiceDeps) {
  return {
    queries: {
      list: (params: ActivityTypes.ActivityListParams, context: Context) => activityQueryList(deps, { ...params, context }),
      run: (params: ActivityTypes.ActivityRunParams, context: Context) => activityQueryRun(deps, { ...params, context }),
    },
  };
}

export type ActivityService = ReturnType<typeof makeActivityService>;
