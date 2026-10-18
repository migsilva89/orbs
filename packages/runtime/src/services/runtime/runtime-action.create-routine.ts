import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { RoutineCreateInput } from '@openbots/contracts/universal';

export async function runtimeActionCreateRoutine(deps: RuntimeServiceDeps, params: RoutineCreateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.routines.actions.create({ ...params, conversationId: conversation.id }, context);
}
