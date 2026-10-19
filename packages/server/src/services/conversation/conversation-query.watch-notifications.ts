import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { conversationWatchStream } from './conversation-watch.utils';
import type { ConversationListWatchParams, ConversationServiceDeps } from '../../types/conversation.types';

export async function conversationQueryWatchNotifications(
  { auth, runtime }: ConversationServiceDeps,
  { deviceId, authorization, signal }: ConversationListWatchParams,
) {
  const revoked = new AbortController();
  const lifetime = AbortSignal.any([revoked.signal, signal ?? revoked.signal]);

  const unsubscribe = auth.onRevoke((id) => match(id)
    .with(deviceId, () => revoked.abort(new Errors.UNAUTHORIZED()))
    .otherwise(() => undefined));

  try {
    await auth.queries.authenticate({ authorization });
    const watch = await runtime.watchNotifications(withAbortSignal(lifetime, BACKGROUND_CONTEXT));
    void watch.closed.then(unsubscribe);

    return conversationWatchStream(watch, lifetime, (value) => value);
  } catch (error) {
    revoked.abort(error);
    unsubscribe();
    throw error;
  }
}
