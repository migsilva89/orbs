import type { RoutineServiceDeps } from '../../types/routine.types';
import type { RoutineUpdateInput } from '@repo/contracts/universal';

export async function routineActionUpdate({ bots, runtime }: RoutineServiceDeps, params: RoutineUpdateInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.updateRoutine(params);
}
