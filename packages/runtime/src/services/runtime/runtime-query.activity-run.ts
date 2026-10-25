import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ActivityRunGetInput } from '@repo/contracts/universal';

export async function runtimeQueryActivityRun(deps: RuntimeServiceDeps, { botId, runId, context }: ActivityRunGetInput & RuntimeContextInput) {
  const conversation = await runtimeQueryConversation(deps, { botId, context });
  return deps.activity.queries.run({ conversationId: conversation.id, runId }, context);
}
