import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function runtimeQueryListRoutines(deps: RuntimeServiceDeps, params: BotGetInput, context: Context) {
  const conversation = await runtimeQueryConversation(deps, { botId: params.botId }, context);
  return deps.routines.queries.list({ ...params, conversationId: conversation.id }, context);
}
