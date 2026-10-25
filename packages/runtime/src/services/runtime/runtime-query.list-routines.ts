import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function runtimeQueryListRoutines(deps: RuntimeServiceDeps, { context, ...params }: BotGetInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId, context });
  return deps.routines.queries.list({ ...params, conversationId: conversation.id }, context);
}
