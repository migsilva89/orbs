import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { TodoCreateInput } from '@openbots/contracts/universal';

export async function runtimeActionCreateTodo(deps: RuntimeServiceDeps, { botId, ...params }: TodoCreateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return deps.todos.actions.create({ ...params, conversationId: conversation.id }, context);
}
