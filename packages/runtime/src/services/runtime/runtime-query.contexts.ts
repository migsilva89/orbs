import { StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { runtimeTemporaryCursor } from '../../types/runtime.types';
import { collaborationTemporaryLinks } from '../collaboration/collaboration.constants';
import { runtimeContextItem, runtimeContextTemporaryItem } from './runtime-context.utils';
import { runtimeQueryConversation } from './runtime-query.conversation';
import type { RuntimeContextInput, RuntimeServiceDeps } from '../../types/runtime.types';
import type { ConversationId } from '@earendil-works/pi-durable';
import type { ConversationContextPage, ConversationContextsInput } from '@repo/contracts/universal';

export async function runtimeQueryContexts(
  deps: RuntimeServiceDeps,
  params: ConversationContextsInput & RuntimeContextInput,
): Promise<ConversationContextPage> {
  const { context } = params;

  async function runtimeQuerySubagentContexts(sourceConversationId: ConversationId): Promise<ConversationContextPage> {
    const page = await deps.harness.commit(
      (tx) => tx.scanConversations({ ownerConversationId: sourceConversationId, order: 'descending' }, params.limit, params.cursor),
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
        sourceConversationId,
        isRunning: running.has(record.id),
      }, context)));

      return { items: items.flatMap((item) => item ?? []), next: page.next };
    } finally {
      graph.dispose();
    }
  }

  const conversation = await runtimeQueryConversation(deps, params);

  return match(params.kind)
    .with('subagent', () => runtimeQuerySubagentContexts(conversation.id))
    .with('temporary', async () => {
      const { offset } = match(runtimeTemporaryCursor.safeParse(params.cursor ?? { offset: 0 }))
        .with({ success: true }, ({ data }) => data)
        .otherwise(({ error }) => {
          throw new Errors.VALIDATION_ERROR({ fields: {}, cause: error });
        });

      const links = await deps.harness.snapshot(collaborationTemporaryLinks, conversation.id, context);
      const sorted = [...(links?.links ?? [])].sort((left, right) => right.createdAt - left.createdAt);
      const page = sorted.slice(offset, offset + params.limit);
      const items = await Promise.all(page.map((link) => runtimeContextTemporaryItem(deps, link, conversation.id, context)));

      return {
        items: items.flatMap((item) => item ?? []),
        next: match(offset + params.limit < sorted.length)
          .with(true, () => ({ offset: offset + params.limit }))
          .with(false, () => undefined)
          .exhaustive(),
      };
    })
    .exhaustive();
}
