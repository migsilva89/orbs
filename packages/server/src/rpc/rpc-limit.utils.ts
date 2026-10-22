import { AsyncIteratorClass, isAsyncIteratorObject } from '@orpc/shared';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import type { LimitLease } from '../types/limit.types';
import type { RpcLimitOutputParams } from '../types/rpc-limit.types';

export async function rpcLimitOutput<T>({ limits, auth, deviceId, authorization, output, signal }: RpcLimitOutputParams<T>) {
  return match(output)
    .when(isAsyncIteratorObject, async (iterator) => {
      let lease: LimitLease;

      try {
        lease = limits.acquire({ kind: 'watch' });
      } catch (error) {
        await iterator.return?.();
        throw error;
      }

      const revocation = new AbortController();

      const revoked = new Promise<never>((_resolve, reject) => {
        revocation.signal.addEventListener('abort', () => reject(new Errors.UNAUTHORIZED()), { once: true });
      });

      revoked.catch(() => undefined);

      const stream = new AsyncIteratorClass(() => Promise.race([iterator.next(), revoked]), async ({ kind }) => {
        signal?.removeEventListener('abort', rpcLimitCancel);
        unsubscribe();
        lease.release();
        const closing = Promise.resolve(iterator.return?.()).catch(() => undefined);

        await match(kind)
          .with('error', () => undefined)
          .otherwise(() => closing);
      });

      function rpcLimitCancel() {
        void stream.return().catch(() => undefined);
      }

      const unsubscribe = auth.onRevoke((id) => match(id)
        .with(deviceId, () => revocation.abort())
        .otherwise(() => undefined));

      signal?.addEventListener('abort', rpcLimitCancel, { once: true });
      match(signal?.aborted)
        .with(true, rpcLimitCancel)
        .otherwise(() => undefined);

      try {
        await auth.queries.authenticate({ authorization });
        return stream;
      } catch (error) {
        await stream.return();
        throw error;
      }
    })
    .otherwise((value) => value);
}

