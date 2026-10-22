import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { RoutineDocument, RoutineRecord } from '../../types/routine.types';
import type { Routine } from '@repo/contracts/universal';

export function routineGet(doc: RoutineDocument, routineId: string): RoutineRecord {
  return match(doc.routines[routineId])
    .with(P.nonNullable, (routine) => routine)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'routine', resourceId: routineId });
    });
}

export function routineCopy(record: RoutineRecord): Routine {
  return {
    id: record.id,
    botId: record.botId,
    conversationId: record.conversationId,
    name: record.name,
    prompt: record.prompt,
    schedule: { ...record.schedule },
    isEnabled: record.isEnabled,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    nextRunAt: record.nextRunAt,
    runRequestedAt: record.runRequestedAt,
    lastRun: match(record.lastRun).with(P.nonNullable, (run) => ({ ...run })).otherwise(() => null),
  };
}
