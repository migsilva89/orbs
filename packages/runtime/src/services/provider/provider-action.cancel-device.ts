import { match } from 'ts-pattern';
import { providerAbort, providerSweep } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export function providerActionCancelDevice(
  deps: ProviderTypes.ProviderServiceDeps,
  { deviceId }: ProviderTypes.ProviderCancelDeviceParams,
) {
  providerSweep(deps);

  for (const session of deps.sessions.values()) {
    match(session.deviceId === deviceId && session.status === 'pending')
      .with(true, () => providerAbort(session))
      .with(false, () => undefined)
      .exhaustive();
  }
}
