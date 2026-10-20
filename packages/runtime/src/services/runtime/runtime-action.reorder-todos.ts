import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { TodoReorderInput } from '@openbots/contracts/universal';

export async function runtimeActionReorderTodos(deps: RuntimeServiceDeps, { botId, ...params }: TodoReorderInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return deps.todos.actions.reorder({ ...params, conversationId: conversation.id }, context);
}
