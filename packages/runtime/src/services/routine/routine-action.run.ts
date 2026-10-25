import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { routineDocument } from './routine.constants';
import { routineCopy, routineGet } from './routine.utils';
import type { RoutineContextParams, RoutineServiceDeps, RoutineTargetParams } from '../../types/routine.types';

export async function routineActionRun({ harness }: RoutineServiceDeps, { context, ...params }: RoutineTargetParams & RoutineContextParams) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);
    const record = routineGet(doc, params.routineId);
    match(record.lastRun?.status === 'running' || record.runRequestedAt !== null)
      .with(true, () => {
        throw new Errors.CONFLICT();
      })
      .with(false, () => undefined)
      .exhaustive();
    record.runRequestedAt = Date.now();
    record.revision += 1;

    return routineCopy(record);
  }, context);
}
