import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBotConversations } from './runtime.constants';
import type { RuntimeServiceDeps, RuntimeSubmissionParams } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';

export async function runtimeQuerySubmission(deps: RuntimeServiceDeps, params: RuntimeSubmissionParams, context: Context) {
  const binding = await deps.harness.snapshot(runtimeBotConversations, params.botId, context);

  return match(binding?.conversationId)
    .with(P.nonNullable, async () => {
      const conversation = await runtimeQueryConversation(deps, params, context);
      const submission = await deps.harness.commit((tx) => tx.submissionByRequest(conversation.id, params.requestId), context);
      return submission?.id;
    })
    .otherwise(() => undefined);
}
