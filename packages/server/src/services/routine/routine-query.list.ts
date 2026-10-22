import type { RoutineServiceDeps } from '../../types/routine.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function routineQueryList({ bots, runtime }: RoutineServiceDeps, params: BotGetInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.routines(params);
}
