import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeContextItem } from './runtime-contexts.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeServiceDeps } from '../../types/runtime.types';
import type { Context } from '@earendil-works/chord/context';
import type { ConversationContextPage, ConversationContextsInput } from '@openbots/contracts/universal';

export async function runtimeQueryContexts(
  deps: RuntimeServiceDeps,
  params: ConversationContextsInput,
  context: Context,
): Promise<ConversationContextPage> {
  const conversation = await runtimeQueryConversation(deps, params, context);

  const query = match(params.kind)
    .with('subagent', () => ({ ownerConversationId: conversation.id, order: 'descending' as const }))
    .with('temporary', () => ({ order: 'descending' as const }))
    .exhaustive();

  const page = await deps.harness.commit(
    (tx) => tx.scanConversations(query, params.limit, params.cursor),
    context,
  ).catch((error: unknown) => {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  });

  const graph = await deps.harness.taskGraph(context);

  try {
    const running = new Set(Object.values(graph.value.tasks)
      .filter((task) => !task.abortRequested && !task.background)
      .map((task) => task.conversationId));

    const items = await Promise.all(page.items.map((record) => runtimeContextItem(deps, {
      record,
      sourceConversationId: conversation.id,
      kind: params.kind,
      isRunning: running.has(record.id),
    }, context)));

    return { items: items.flatMap((item) => item ?? []), next: page.next };
  } finally {
    graph.dispose();
  }
}
