import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { limitPeerKey, limitRetryAfterSeconds } from './limit.utils';
import type { LimitRuntimeDeps, LimitThrottleParams } from '../../types/limit.types';

export async function limitActionThrottle({ state }: LimitRuntimeDeps, params: LimitThrottleParams) {
  const result = await match(params)
    .with({ kind: 'public' }, ({ peer }) => state.windows.public.limit(limitPeerKey(peer)))
    .with({ kind: 'redeem' }, ({ peer }) => state.windows.redeem.limit(limitPeerKey(peer)))
    .with({ kind: 'device' }, ({ deviceId }) => state.windows.device.limit(deviceId))
    .exhaustive();

  match(result)
    .with({ success: true }, () => undefined)
    .with({ success: false }, ({ reset }) => {
      throw new Errors.RATE_LIMITED({ retryAfter: limitRetryAfterSeconds(reset ?? Date.now()) });
    })
    .exhaustive();
}
