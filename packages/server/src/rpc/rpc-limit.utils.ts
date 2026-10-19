import { AsyncIteratorClass, isAsyncIteratorObject } from '@orpc/shared';
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

      const stream = new AsyncIteratorClass(() => iterator.next(), async () => {
        signal?.removeEventListener('abort', rpcLimitCancel);
        unsubscribe();
        lease.release();
        await iterator.return?.();
      });

      function rpcLimitCancel() {
        void stream.return().catch(() => undefined);
      }

      const unsubscribe = auth.onRevoke((id) => match(id)
        .with(deviceId, rpcLimitCancel)
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

