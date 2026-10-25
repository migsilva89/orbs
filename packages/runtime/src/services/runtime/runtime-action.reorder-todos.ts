import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { TodoReorderInput } from '@repo/contracts/universal';

export async function runtimeActionReorderTodos(deps: RuntimeServiceDeps, { botId, context, ...params }: TodoReorderInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.todos.actions.reorder({ ...params, conversationId: conversation.id }, context);
}
