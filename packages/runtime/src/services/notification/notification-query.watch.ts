import { replicatedState } from '@earendil-works/chord';
import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import {
  notificationCommitAttention,
  notificationCommitIsRelevant,
  notificationPendingItems,
  notificationRecentAppend,
  notificationToolTaskIds,
} from './notification.utils';
import type * as NotificationTypes from '../../types/notification.types';
import type { Context } from '@earendil-works/chord/context';
import type * as PiDurableTypes from '@earendil-works/pi-durable';

export async function notificationQueryWatch(deps: NotificationTypes.NotificationServiceDeps, context: Context) {
  const { harness, botId } = deps;
  const queued: NotificationTypes.NotificationQueuedCommit[] = [];
  let tasks: PiDurableTypes.TaskGraph;
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
    const pending = await notificationPendingItems(deps, tasks, context);
    match(isStopped)
      .with(true, () => undefined)
      .with(false, () => {
        state.change(commitContext, (draft) => {
          draft.pending = pending;
        });
      })
      .exhaustive();
  };

  const applyQueued = async () => {
    const batch = queued.splice(0);

    await match({ isStopped, empty: batch.length === 0 })
      .with({ isStopped: true }, () => undefined)
      .with({ empty: true }, () => undefined)
      .otherwise(async () => {
        const attention = notificationCommitAttention(batch.flatMap(({ publication }) => publication.changes));

        const items: NotificationTypes.NotificationItem[] = [
          ...attention.replies.map((entry) => ({ kind: 'reply' as const, botId, conversationId: entry.conversationId, entryId: entry.id })),
          ...attention.failures.map((task) => ({ kind: 'failure' as const, botId, conversationId: task.conversationId, taskId: task.id })),
        ];

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
    const graph = await harness.watchTaskGraph(context);

    stop = async () => {
      isStopped = true;
      unsubscribe();
      stopping ??= graph.stop();

      return stopping;
    };

    try {
      tasks = graph.value;
      toolIds = notificationToolTaskIds(tasks);
      await publishPending(context);
      isAttached = true;
      enqueue(() => applyQueued());

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

      const closed = graph.closed.then(async (end) => {
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
    throw error;
  }
}
