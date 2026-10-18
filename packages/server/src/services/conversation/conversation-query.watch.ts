import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { conversationWatchStream } from './conversation-watch.utils';
import type { ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';

export async function conversationQueryWatch(
  { auth, runtime, bots }: ConversationServiceDeps,
  { deviceId, botId, conversationId, authorization, signal }: ConversationWatchParams,
) {
  const revoked = new AbortController();
  const lifetime = AbortSignal.any([revoked.signal, signal ?? revoked.signal]);

  const unsubscribe = auth.onRevoke((id) => match(id)
    .with(deviceId, () => revoked.abort(new Errors.UNAUTHORIZED()))
    .otherwise(() => undefined));

  try {
    await auth.queries.authenticate({ authorization });
    await bots.queries.get({ botId });
    const watch = await runtime.watch({ botId, conversationId }, withAbortSignal(lifetime, BACKGROUND_CONTEXT));
    void watch.closed.then(unsubscribe);

    return conversationWatchStream(watch, lifetime, (value) => value);
  } catch (error) {
    revoked.abort(error);
    unsubscribe();
    throw error;
  }
}
