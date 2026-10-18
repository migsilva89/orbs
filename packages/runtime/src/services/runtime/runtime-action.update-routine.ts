import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { RoutineUpdateInput } from '@openbots/contracts/universal';

export async function runtimeActionUpdateRoutine(deps: RuntimeServiceDeps, params: RoutineUpdateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.routines.actions.update({ ...params, conversationId: conversation.id }, context);
}
