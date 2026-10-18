import { routineDocument } from './routine.constants';
import { routineCopy } from './routine.utils';
import type { RoutineConversationParams, RoutineServiceDeps } from '../../types/routine.types';
import type { Context } from '@earendil-works/chord/context';

export async function routineQueryList({ harness }: RoutineServiceDeps, params: RoutineConversationParams, context: Context) {
  const doc = await harness.snapshot(routineDocument, params.conversationId, context);
  return Object.values(doc?.routines ?? {}).map(routineCopy).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
