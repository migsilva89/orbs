import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ActivityListInput } from '@repo/contracts/universal';

export async function runtimeQueryActivity(deps: RuntimeServiceDeps, { botId, before, context }: ActivityListInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.activity.queries.list({ conversationId: conversation.id, before }, context);
}
