import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { TodoTarget } from '@repo/contracts/universal';

export async function runtimeActionRemoveTodo(deps: RuntimeServiceDeps, { botId, context, ...params }: TodoTarget & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.todos.actions.remove({ ...params, conversationId: conversation.id }, context);
}
