import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { BotGetInput } from '@repo/contracts/universal';

export async function runtimeQueryListTodos(deps: RuntimeServiceDeps, params: BotGetInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.todos.queries.list({ conversationId: conversation.id }, context);
}
