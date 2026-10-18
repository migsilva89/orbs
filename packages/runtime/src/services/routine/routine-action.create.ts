import { match } from 'ts-pattern';
import { routineNextRunAt } from './routine-schedule.utils';
import { routineDocument } from './routine.constants';
import { routineTask } from './routine.task';
import { routineCopy } from './routine.utils';
import type { RoutineCreateParams, RoutineRecord, RoutineServiceDeps } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineActionCreate({ harness }: RoutineServiceDeps, params: RoutineCreateParams, context: Context) {
  const now = Date.now();
  const nextRunAt = routineNextRunAt(params.schedule, now);
  const id = crypto.randomUUID();

  const result = await harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);

    const taskId = await tx.createTask(routineTask, { routineId: id }, {
      conversationId: params.conversationId,
      ownership: { kind: 'conversation' },
      background: true,
    });

    const record: RoutineRecord = {
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
  }, context);

  harness.resume();

  return result;
}
