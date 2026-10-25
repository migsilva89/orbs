import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { RoutineCreateInput } from '@repo/contracts/universal';

export async function runtimeActionCreateRoutine(deps: RuntimeServiceDeps, { context, ...params }: RoutineCreateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId, context });
  return deps.routines.actions.create({ ...params, conversationId: conversation.id }, context);
}
