import { BACKGROUND_CONTEXT } from '@earendil-works/chord/context';
import { log } from '@openbots/logger/server';
import { match, P } from 'ts-pattern';
import { conversationIndexActionRestore } from './conversation-index-action.restore';
import { conversationIndexActionUpdate } from './conversation-index-action.update';
import { conversationIndexQueryList } from './conversation-index-query.list';
import { conversationIndexQueryWatch } from './conversation-index-query.watch';
import { conversationIndex } from './conversation-index.constants';
import { conversationIndexMessage } from './conversation-index.utils';
import type * as ConversationIndexTypes from '../../types/conversation-index.types';
import type { Context } from '@earendil-works/chord/context';

export async function makeConversationIndexService({ harness }: ConversationIndexTypes.ConversationIndexServiceDeps) {
  const deps: ConversationIndexTypes.ConversationIndexDeps = { harness, conversations: new Set() };
  await harness.commit(async (tx) => {
    await tx.doc(conversationIndex);
  }, BACKGROUND_CONTEXT);
  let isClosed = false;
  let pending = Promise.resolve();
  // The update is idempotent, so a failed batch is retried with the next commit instead of breaking the sidebar.
  let unapplied: ConversationIndexTypes.ConversationIndexUpdate[] = [];

  const update = (messages: ConversationIndexTypes.ConversationIndexUpdate[]) => match(isClosed)
    .with(true, () => undefined)
    .with(false, () => {
      const batch = [...unapplied, ...messages];
      unapplied = [];
      pending = conversationIndexActionUpdate(deps, batch, BACKGROUND_CONTEXT).catch((error: unknown) => {
        unapplied = [...batch, ...unapplied];
        log.error({
          tag: 'conversation-index',
          message: 'Cannot update conversation index; retrying with the next commit.',
          error,
        });
      });
    })
    .exhaustive();

  const unsubscribe = harness.subscribeCommits((publication) => {
    const messages = publication.changes
      .filter((change) => change.type === 'entry')
      .filter(({ value }) => deps.conversations.has(value.conversationId))
      .flatMap(({ value }) => match(conversationIndexMessage(value))
        .with(P.nonNullable, (lastMessage) => [{ conversationId: value.conversationId, lastMessage }])
        .otherwise(() => []));

    // Pi commit listeners cannot call Session APIs. Admit the derived write after publication.
    match(messages.length > 0)
      .with(true, () => queueMicrotask(() => update(messages)))
      .with(false, () => undefined)
      .exhaustive();
  });

  harness.subscribeClose(() => {
    isClosed = true;
    unsubscribe();
  });

  return {
    watch: async (context: Context) => {
      await pending;
      return conversationIndexQueryWatch(deps, context);
    },
    actions: {
      restore: (params: ConversationIndexTypes.ConversationIndexRestoreParams, context: Context) => conversationIndexActionRestore(deps, params, context),
    },
    queries: {
      list: async (context: Context) => {
        await pending;
        return conversationIndexQueryList(deps, context);
      },
    },
  };
}

export type ConversationIndexService = Awaited<ReturnType<typeof makeConversationIndexService>>;
