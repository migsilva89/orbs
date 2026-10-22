import type { RoutineServiceDeps } from '../../types/routine.types';
import type { RoutineTarget } from '@repo/contracts/universal';

export async function routineActionRemove({ bots, runtime }: RoutineServiceDeps, params: RoutineTarget) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.removeRoutine(params);
}
