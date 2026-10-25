import { routineDocument } from './routine.constants';
import { routineGet } from './routine.utils';
import type { RoutineContextParams, RoutineServiceDeps, RoutineTargetParams } from '../../types/routine.types';

export async function routineActionRemove({ harness }: RoutineServiceDeps, { context, ...params }: RoutineTargetParams & RoutineContextParams) {
  await harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);
    routineGet(doc, params.routineId);
    doc.routines = Object.fromEntries(Object.entries(doc.routines).filter(([id]) => id !== params.routineId));
  }, context);
}
