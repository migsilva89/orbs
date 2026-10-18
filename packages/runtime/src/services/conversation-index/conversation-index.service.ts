import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { Errors } from '@openbots/errors/universal';
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
  const failed = new AbortController();
  let isClosed = false;
  let pending = Promise.resolve();
  let failure: Error | null = null;

  const update = (messages: ConversationIndexTypes.ConversationIndexUpdate[]) => match(isClosed)
    .with(true, () => undefined)
    .with(false, () => {
      pending = conversationIndexActionUpdate(deps, messages, BACKGROUND_CONTEXT);
      void pending.catch((error: unknown) => {
        failure = new Errors.INTERNAL_ERROR({ internal: 'Cannot update conversation index.', cause: error });
        failed.abort(failure);
        log.error({
          tag: 'conversation-index',
          message: 'Cannot update conversation index.',
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
      const watch = await conversationIndexQueryWatch(deps, withAbortSignal(failed.signal, context));

      const closed = watch.closed.then((end) => match(failure)
        .with(P.nonNullable, (error) => ({ reason: 'listener_error' as const, error }))
        .otherwise(() => end));

      return { ...watch, closed };
    },
    actions: {
      restore: (params: ConversationIndexTypes.ConversationIndexRestoreParams, context: Context) => conversationIndexActionRestore(deps, params, context),
    },
    queries: {
      list: async (context: Context) => {
        await pending;

        return match(failure)
          .with(null, () => conversationIndexQueryList(deps, context))
          .otherwise((error) => {
            throw error;
          });
      },
    },
  };
}

export type ConversationIndexService = Awaited<ReturnType<typeof makeConversationIndexService>>;
