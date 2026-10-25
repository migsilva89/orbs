import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { RoutineUpdateInput } from '@repo/contracts/universal';

export async function runtimeActionUpdateRoutine(deps: RuntimeServiceDeps, { context, ...params }: RoutineUpdateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId, context });
  return deps.routines.actions.update({ ...params, conversationId: conversation.id }, context);
}
