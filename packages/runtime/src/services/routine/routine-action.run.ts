import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { routineDocument } from './routine.constants';
import { routineCopy, routineGet } from './routine.utils';
import type { RoutineServiceDeps, RoutineTargetParams } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineActionRun({ harness }: RoutineServiceDeps, params: RoutineTargetParams, context: Context) {
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
