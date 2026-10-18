import { match } from 'ts-pattern';
import { routineNextRunAt } from './routine-schedule.utils';
import { routineDocument } from './routine.constants';
import { routineCopy, routineGet } from './routine.utils';
import type { RoutineServiceDeps, RoutineUpdateParams } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineActionUpdate({ harness }: RoutineServiceDeps, params: RoutineUpdateParams, context: Context) {
  return harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);
    const record = routineGet(doc, params.routineId);
    const schedule = params.schedule ?? record.schedule;
    const now = Date.now();
    const nextRunAt = routineNextRunAt(schedule, now);
    const isEnabled = params.isEnabled ?? record.isEnabled;
    const shouldReschedule = params.schedule !== undefined || isEnabled !== record.isEnabled;
    record.name = params.name ?? record.name;
    record.prompt = params.prompt ?? record.prompt;
    record.schedule = { ...schedule };
    record.isEnabled = isEnabled;
    record.nextRunAt = match({ isEnabled, shouldReschedule })
      .with({ isEnabled: false }, () => null)
      .with({ shouldReschedule: true }, () => nextRunAt)
      .otherwise(() => record.nextRunAt);
    record.revision += 1;
    record.scheduleRevision += Number(shouldReschedule);
    record.updatedAt = now;

    return routineCopy(record);
  }, context);
}
