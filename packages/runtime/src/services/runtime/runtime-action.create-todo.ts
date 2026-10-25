import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { TodoCreateInput } from '@repo/contracts/universal';

export async function runtimeActionCreateTodo(deps: RuntimeServiceDeps, { botId, context, ...params }: TodoCreateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.todos.actions.create({ ...params, conversationId: conversation.id }, context);
}
