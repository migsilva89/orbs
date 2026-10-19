import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import type { LimitAcquireParams, LimitLease, LimitRuntimeDeps } from '../../types/limit.types';

export function limitActionAcquire({ state }: LimitRuntimeDeps, { kind }: LimitAcquireParams): LimitLease {
  const cap = match(kind)
    .with('rpc', () => state.settings.rpcInFlight)
    .with('watch', () => state.settings.watchInFlight)
    .exhaustive();

  const used = match(kind)
    .with('rpc', () => state.rpcCount)
    .with('watch', () => state.watchCount)
    .exhaustive();

  match(used < cap)
    .with(true, () => undefined)
    .with(false, () => {
      throw new Errors.RATE_LIMITED({ retryAfter: 1 });
    })
    .exhaustive();

  match(kind)
    .with('rpc', () => {
      state.rpcCount += 1;
    })
    .with('watch', () => {
      state.watchCount += 1;
    })
    .exhaustive();

  let isReleased = false;

  return {
    release: () => {
      match(isReleased)
        .with(true, () => undefined)
        .with(false, () => {
          isReleased = true;
          match(kind)
            .with('rpc', () => {
              state.rpcCount -= 1;
            })
            .with('watch', () => {
              state.watchCount -= 1;
            })
            .exhaustive();
        })
        .exhaustive();
    },
  };
}
