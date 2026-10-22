import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { RoutineTarget } from '@repo/contracts/universal';

export async function runtimeActionRunRoutine(deps: RuntimeServiceDeps, params: RoutineTarget, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.routines.actions.run({ ...params, conversationId: conversation.id }, context);
}
