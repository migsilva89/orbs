import { UsageDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';

export async function runtimeQueryUsage(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams & RuntimeContextInput,
) {
  const { context } = params;
  const conversation = await runtimeQueryConversation(deps, params);
  const usage = await deps.harness.snapshot(UsageDoc, conversation.id, context);

  return match(usage)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => ({ models: {}, tools: {} }));
}
