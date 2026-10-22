import type { RoutineServiceDeps } from '../../types/routine.types';
import type { RoutineCreateInput } from '@repo/contracts/universal';

export async function routineActionCreate({ bots, runtime }: RoutineServiceDeps, params: RoutineCreateInput) {
  await bots.actions.configure({ botId: params.botId });
  return runtime.actions.createRoutine(params);
}
