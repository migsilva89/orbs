import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { RoutineTarget } from '@repo/contracts/universal';

export async function runtimeActionRemoveRoutine(deps: RuntimeServiceDeps, { context, ...params }: RoutineTarget & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId, context });
  return deps.routines.actions.remove({ ...params, conversationId: conversation.id }, context);
}
