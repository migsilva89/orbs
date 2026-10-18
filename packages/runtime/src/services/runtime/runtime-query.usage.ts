import { UsageDoc } from '@earendil-works/pi-durable';
import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeConversationParams, RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQueryUsage(
  deps: RuntimeServiceDeps,
  params: RuntimeConversationParams,
  context: Context,
) {
  const conversation = await runtimeQueryConversation(deps, params, context);
  const usage = await deps.harness.snapshot(UsageDoc, conversation.id, context);

  return match(usage)
    .with(P.nonNullable, (value) => value)
    .otherwise(() => ({ models: {}, tools: {} }));
}
