import type { RoutineServiceDeps } from '../../types/routine.types';
import type { RoutineTarget } from '@openbots/contracts/universal';

export async function routineActionRun({ bots, runtime }: RoutineServiceDeps, params: RoutineTarget) {
  await bots.actions.configure({ botId: params.botId });
  return runtime.actions.runRoutine(params);
}
