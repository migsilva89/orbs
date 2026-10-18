import { copyJson } from '@earendil-works/chord';
import { BACKGROUND_CONTEXT, withAbortSignal } from '@earendil-works/chord/context';
import { diffRevisions } from '@earendil-works/chord/delta';
import { Errors } from '@openbots/errors/universal';
import { streamToAsyncIteratorObject } from '@orpc/server';
import { match, P } from 'ts-pattern';
import type { ConversationServiceDeps, ConversationWatchParams } from '../../types/conversation.types';
import type { JsonValue } from '@earendil-works/chord';
import type { ConversationFrame } from '@openbots/contracts/universal';

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
    const stream = new TransformStream<ConversationFrame, ConversationFrame>();
    const writer = stream.writable.getWriter();

    void writer.closed.catch(() => watch.stop());

    let previous: JsonValue = null;

    const unwatch = watch.state.subscribe(async (value) => {
      const current = copyJson(value, { omitUndefinedProperties: true });
      const ops = diffRevisions(previous, current);
      previous = current;
      await writer.write(ops).catch(() => watch.stop());
    });

    void watch.closed.then(async (end) => {
      unwatch();
      unsubscribe();
      await match({ aborted: revoked.signal.aborted, end })
        .with({ aborted: true }, () => writer.abort(revoked.signal.reason))
        .with({ end: { reason: P.union('session_failed', 'listener_error') } }, ({ end: { error } }) => {
          const cause = match(error)
            .with(P.instanceOf(Error), (failure) => failure)
            .otherwise((failure) => new Errors.INTERNAL_ERROR({ cause: failure }));

          return writer.abort(cause);
        })
        .otherwise(() => writer.close())
        .catch(() => undefined);
    });

    return streamToAsyncIteratorObject(stream.readable, { signal: lifetime });
  } catch (error) {
    revoked.abort(error);
    unsubscribe();
    throw error;
  }
}
