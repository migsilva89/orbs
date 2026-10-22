import { copyJson } from '@earendil-works/chord';
import { diffRevisions } from '@earendil-works/chord/delta';
import { streamToAsyncIteratorObject } from '@orpc/server';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import type { ConversationSubscription, ConversationWatchTransform } from '../../types/conversation.types';
import type { JsonValue } from '@earendil-works/chord';
import type { ConversationFrame } from '@repo/contracts/universal';

export function conversationWatchStream<T extends object>(
  watch: ConversationSubscription<T>,
  signal: AbortSignal,
  transform: ConversationWatchTransform<T>,
) {
  const stream = new TransformStream<ConversationFrame, ConversationFrame>();
  const writer = stream.writable.getWriter();
  let previous: JsonValue = null;

  void writer.closed.catch(() => watch.stop());

  const unsubscribe = watch.state.subscribe(async (value) => {
    try {
      const current = copyJson(await transform(value), { omitUndefinedProperties: true });
      const ops = diffRevisions(previous, current);
      previous = current;
      await writer.write(ops);
    } catch (error) {
      void writer.abort(error).catch(() => undefined);
      await watch.stop();
    }
  });

  void watch.closed.then(async (end) => {
    unsubscribe();
    await match({ aborted: signal.aborted, end })
      .with({ aborted: true }, () => writer.abort(signal.reason))
      .with({ end: { reason: P.union('session_failed', 'listener_error') } }, ({ end: { error } }) => {
        const cause = match(error)
          .with(P.instanceOf(Error), (failure) => failure)
          .otherwise((failure) => new Errors.INTERNAL_ERROR({ cause: failure }));

        return writer.abort(cause);
      })
      .otherwise(() => writer.close())
      .catch(() => undefined);
  });

  return streamToAsyncIteratorObject(stream.readable, { signal });
}
