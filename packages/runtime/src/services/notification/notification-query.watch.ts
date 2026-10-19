import { replicatedState } from '@earendil-works/chord';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { conversationIndex } from '../conversation-index/conversation-index.constants';
import {
  notificationBotId,
  notificationCommitAttention,
  notificationCommitIsRelevant,
  notificationIsMuted,
  notificationMuteKey,
  notificationPendingItems,
  notificationRecentAppend,
  notificationToolTaskIds,
} from './notification.utils';
import type { ConversationIndexDocument } from '../../types/conversation-index.types';
import type * as NotificationTypes from '../../types/notification.types';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export async function notificationQueryWatch({ harness }: NotificationTypes.NotificationServiceDeps, context: Context) {
  const cache = new Map<number, string>();
  const queued: NotificationTypes.NotificationQueuedCommit[] = [];
  let summaries: ConversationIndexDocument | null | undefined;
  let tasks: PiDurableTypes.TaskGraph;
  let muteKey = '';
  let toolIds = '';
  let isAttached = false;
  let isStopped = false;
  let failure: Error | undefined;
  let work = Promise.resolve();
  let stopping: Promise<PiDurableTypes.WatchEnd> | undefined;
  const state = replicatedState<NotificationTypes.NotificationState>({ pending: [], recent: [] });

  const unsubscribe = harness.subscribeCommits((publication, commitContext) => {
    match(notificationCommitIsRelevant(publication.changes))
      .with(true, () => {
        queued.push({ publication, commitContext });
        match(isAttached)
          .with(true, () => enqueue(() => applyQueued()))
          .with(false, () => undefined)
          .exhaustive();
      })
      .with(false, () => undefined)
      .exhaustive();
  });

  const enqueue = (task: () => Promise<void>) => {
    work = work
      .then(() => match(isStopped)
        .with(true, () => undefined)
        .with(false, () => task())
        .exhaustive())
      .catch(async (error: unknown) => {
        failure = match(error)
          .with(P.instanceOf(Error), (value) => value)
          .otherwise((value) => new Errors.INTERNAL_ERROR({ cause: value }));
        await stop();
      });
  };

  const publishPending = async (commitContext: Context) => {
    const pending = await notificationPendingItems(harness, tasks, summaries, cache, context);
    match(isStopped)
      .with(true, () => undefined)
      .with(false, () => {
        state.change(commitContext, (draft) => {
          draft.pending = pending;
        });
      })
      .exhaustive();
  };

  const visibleItem = async (
    conversationId: PiDurableTypes.ConversationId,
    item: Omit<NotificationTypes.NotificationItem, 'botId' | 'conversationId'> & { kind: 'reply' | 'failure' },
  ) => {
    const botId = await notificationBotId(harness, summaries, conversationId, cache, context);

    return match(botId)
      .with(P.string, (id) => match(notificationIsMuted(summaries, id))
        .with(true, () => null)
        .with(false, () => ({ ...item, botId: id, conversationId }))
        .exhaustive())
      .otherwise(() => null);
  };

  const applyQueued = async () => {
    const batch = queued.splice(0);

    await match({ isStopped, empty: batch.length === 0 })
      .with({ isStopped: true }, () => undefined)
      .with({ empty: true }, () => undefined)
      .otherwise(async () => {
        const attention = notificationCommitAttention(batch.flatMap(({ publication }) => publication.changes));

        const additions = await Promise.all([
          ...attention.replies.map((entry) => visibleItem(entry.conversationId, { kind: 'reply', entryId: entry.id })),
          ...attention.failures.map((task) => visibleItem(task.conversationId, { kind: 'failure', taskId: task.id })),
        ]);

        const items = additions.flatMap((item) => match(item)
          .with(P.nonNullable, (value) => [value])
          .otherwise(() => []));

        match(items)
          .with([], () => undefined)
          .otherwise((value) => {
            state.change(batch.at(-1)?.commitContext ?? context, (draft) => {
              for (const item of value) {
                draft.recent = notificationRecentAppend(draft.recent, item);
              }
            });
          });

        await match(attention.shouldRebuild)
          .with(true, () => publishPending(batch.at(-1)?.commitContext ?? context))
          .with(false, () => undefined)
          .exhaustive();
      });
  };

  let stop = async (): Promise<PiDurableTypes.WatchEnd> => {
    isStopped = true;
    unsubscribe();

    return { reason: 'stopped' };
  };

  try {
    const index = match(await harness.watchDoc(conversationIndex, context))
      .with(P.nonNullable, (watch) => watch)
      .otherwise(() => {
        throw new Errors.INTERNAL_ERROR({ internal: 'Conversation index is missing.' });
      });

    try {
      const graph = await harness.watchTaskGraph(context);

      stop = async () => {
        isStopped = true;
        unsubscribe();
        stopping ??= Promise.all([
          index.stop(),
          graph.stop(),
        ]).then(([end]) => end);

        return stopping;
      };

      try {
        summaries = index.value;
        tasks = graph.value;
        muteKey = notificationMuteKey(summaries);
        toolIds = notificationToolTaskIds(tasks);
        await publishPending(context);
        isAttached = true;
        enqueue(() => applyQueued());

        index.start(async (value, _ops, commitContext) => {
          summaries = value;
          const next = notificationMuteKey(summaries);
          match(next === muteKey)
            .with(true, () => undefined)
            .with(false, () => {
              muteKey = next;
              enqueue(() => publishPending(commitContext));
            })
            .exhaustive();
        });
        graph.start(async (value, _ops, commitContext) => {
          tasks = value;
          const next = notificationToolTaskIds(tasks);
          match(next === toolIds)
            .with(true, () => undefined)
            .with(false, () => {
              toolIds = next;
              enqueue(() => publishPending(commitContext));
            })
            .exhaustive();
        });

        const closed = Promise.race([index.closed, graph.closed]).then(async (end) => {
          await stop();
          return match(failure)
            .with(P.nonNullable, (error) => ({ reason: 'listener_error' as const, error }))
            .otherwise(() => end);
        });

        return { state, closed, stop };
      } catch (error) {
        await stop();
        throw error;
      }
    } catch (error) {
      unsubscribe();
      await index.stop();
      throw error;
    }
  } catch (error) {
    unsubscribe();
    throw error;
  }
}
