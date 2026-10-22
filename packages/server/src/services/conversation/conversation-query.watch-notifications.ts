import { replicatedState } from '@earendil-works/chord';
import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { conversationWatchStream } from './conversation-watch.utils';
import type { ConversationListWatchParams, ConversationServiceDeps } from '../../types/conversation.types';
import type { NotificationItem, NotificationState } from '@repo/contracts/universal';

export async function conversationQueryWatchNotifications(
  { auth, runtime, bots, notifications }: ConversationServiceDeps,
  { deviceId, authorization, signal }: ConversationListWatchParams,
) {
  const revoked = new AbortController();
  const lifetime = AbortSignal.any([revoked.signal, signal ?? revoked.signal]);
  const context = withAbortSignal(lifetime, BACKGROUND_CONTEXT);

  const unsubscribe = auth.onRevoke((id) => match(id)
    .with(deviceId, () => revoked.abort(new Errors.UNAUTHORIZED()))
    .otherwise(() => undefined));

  try {
    await auth.queries.authenticate({ authorization });
    const watch = await runtime.watchNotifications(context);
    const state = replicatedState({ notifications: watch.state.value, revision: 0 });

    const unwatch = watch.state.subscribe((value) => {
      state.change(context, (draft) => {
        draft.notifications = value;
      });
    });

    const unsubscribeBots = bots.onChange(() => {
      state.change(context, (draft) => {
        draft.revision += 1;
      });
    });

    const closed = watch.closed.then((end) => {
      unwatch();
      unsubscribeBots();
      unsubscribe();

      return end;
    });

    return conversationWatchStream({
      state,
      closed,
      stop: watch.stop,
    }, lifetime, async (value): Promise<NotificationState> => {
      const preferences = await bots.queries.preferences();
      const conversationIsAudible = (item: NotificationItem) => preferences.get(item.botId)?.isMuted === false;

      const conversationDeliver = (items: NotificationItem[]) => Promise.all(items.filter(conversationIsAudible).map(async (item) => ({
        ...item,
        deliverHere: await notifications.queries.target({ item }) === deviceId,
      })));

      return {
        pending: await conversationDeliver(value.notifications.pending),
        recent: await conversationDeliver(value.notifications.recent),
      };
    });
  } catch (error) {
    revoked.abort(error);
    unsubscribe();
    throw error;
  }
}
