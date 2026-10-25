import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { TodoUpdateInput } from '@repo/contracts/universal';

export async function runtimeActionUpdateTodo(deps: RuntimeServiceDeps, { botId, context, ...params }: TodoUpdateInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.todos.actions.update({ ...params, conversationId: conversation.id }, context);
}
