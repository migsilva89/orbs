import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function runtimeQueryListTodos(deps: RuntimeServiceDeps, { botId, context }: BotGetInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.todos.queries.list({ conversationId: conversation.id }, context);
}
