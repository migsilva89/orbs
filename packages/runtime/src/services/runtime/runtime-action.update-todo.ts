import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { TodoUpdateInput } from '@openbots/contracts/universal';

export async function runtimeActionUpdateTodo(deps: RuntimeServiceDeps, { botId, ...params }: TodoUpdateInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return deps.todos.actions.update({ ...params, conversationId: conversation.id }, context);
}
