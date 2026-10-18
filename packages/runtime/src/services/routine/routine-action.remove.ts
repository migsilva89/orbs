import { routineDocument } from './routine.constants';
import { routineGet } from './routine.utils';
import type { RoutineServiceDeps, RoutineTargetParams } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineActionRemove({ harness }: RoutineServiceDeps, params: RoutineTargetParams, context: Context) {
  await harness.commit(async (tx) => {
    const doc = await tx.doc(routineDocument, params.conversationId);
    routineGet(doc, params.routineId);
    doc.routines = Object.fromEntries(Object.entries(doc.routines).filter(([id]) => id !== params.routineId));
  }, context);
}
