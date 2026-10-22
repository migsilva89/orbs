import { routineActionCreate } from './routine-action.create';
import { routineActionRemove } from './routine-action.remove';
import { routineActionRun } from './routine-action.run';
import { routineActionUpdate } from './routine-action.update';
import { routineQueryList } from './routine-query.list';
import type { RoutineServiceDeps } from '../../types/routine.types';
import type * as UniversalTypes from '@repo/contracts/universal';

export function makeRoutineService(deps: RoutineServiceDeps) {
  return {
    actions: {
      create: (params: UniversalTypes.RoutineCreateInput) => routineActionCreate(deps, params),
      update: (params: UniversalTypes.RoutineUpdateInput) => routineActionUpdate(deps, params),
      run: (params: UniversalTypes.RoutineTarget) => routineActionRun(deps, params),
      remove: (params: UniversalTypes.RoutineTarget) => routineActionRemove(deps, params),
    },
    queries: {
      list: (params: UniversalTypes.BotGetInput) => routineQueryList(deps, params),
    },
  };
}

export type RoutineService = ReturnType<typeof makeRoutineService>;
