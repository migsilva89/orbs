import { match, P } from 'ts-pattern';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBotConversations } from './runtime.constants';
import type { RuntimeContextInput, RuntimeServiceDeps, RuntimeSubmissionParams } from '../../types/runtime.types';

export async function runtimeQuerySubmission(deps: RuntimeServiceDeps, params: RuntimeSubmissionParams & RuntimeContextInput) {
  const { context } = params;
  const binding = await deps.harness.snapshot(runtimeBotConversations, params.botId, context);

  return match(binding?.conversationId)
    .with(P.nonNullable, async () => {
      const conversation = await runtimeQueryConversation(deps, params);
      const submission = await deps.harness.commit((tx) => tx.submissionByRequest(conversation.id, params.requestId), context);
      return submission?.id;
    })
    .otherwise(() => undefined);
}
