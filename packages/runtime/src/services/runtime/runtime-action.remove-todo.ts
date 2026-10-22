import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { TodoTarget } from '@repo/contracts/universal';

export async function runtimeActionRemoveTodo(deps: RuntimeServiceDeps, { botId, ...params }: TodoTarget, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return deps.todos.actions.remove({ ...params, conversationId: conversation.id }, context);
}
