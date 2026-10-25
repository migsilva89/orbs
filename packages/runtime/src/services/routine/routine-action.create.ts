import { match, P } from 'ts-pattern';
import { routineScheduleNextRunAt } from './routine-schedule.utils';
import { routineDocument } from './routine.constants';
import { routineTask } from './routine.task';
import { routineCopy } from './routine.utils';
import type * as RoutineTypes from '../../types/routine.types';

export async function routineActionCreate(
  { harness }: RoutineTypes.RoutineServiceDeps,
  { context, ...params }: RoutineTypes.RoutineCreateParams & RoutineTypes.RoutineContextParams,
) {
  const now = Date.now();
  const nextRunAt = routineScheduleNextRunAt(params.schedule, now);
  const id = params.id ?? crypto.randomUUID();

  const result = await harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);

    return match(doc.routines[id])
      .with(P.nonNullable, (existing) => routineCopy(existing))
      .otherwise(async () => {
        const taskId = await tx.createTask(routineTask, { routineId: id }, {
          conversationId: params.conversationId,
          ownership: { kind: 'conversation' },
          background: true,
        });

        const record: RoutineTypes.RoutineRecord = {
          ...params,
          id,
          taskId,
          revision: 0,
          scheduleRevision: 0,
          occurrence: 0,
          createdAt: now,
          updatedAt: now,
          nextRunAt: match(params.isEnabled).with(true, () => nextRunAt).with(false, () => null).exhaustive(),
          runRequestedAt: null,
          lastRun: null,
        };

        doc.routines[id] = record;

        return routineCopy(record);
      });
  }, context);

  harness.resume();

  return result;
}
