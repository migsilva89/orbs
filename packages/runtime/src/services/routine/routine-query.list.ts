import { routineDocument } from './routine.constants';
import { routineCopy } from './routine.utils';
import type { RoutineContextParams, RoutineConversationParams, RoutineServiceDeps } from '../../types/routine.types';

export async function routineQueryList({ harness }: RoutineServiceDeps, { context, ...params }: RoutineConversationParams & RoutineContextParams) {
  const doc = await harness.snapshot(routineDocument, params.conversationId, context);
  return Object.values(doc?.routines ?? {}).map(routineCopy).sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}
