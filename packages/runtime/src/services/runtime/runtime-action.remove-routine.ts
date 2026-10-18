import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { RoutineTarget } from '@openbots/contracts/universal';

export async function runtimeActionRemoveRoutine(deps: RuntimeServiceDeps, params: RoutineTarget, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.routines.actions.remove({ ...params, conversationId: conversation.id }, context);
}
