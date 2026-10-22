import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { providerAbort, providerOwnedSession, providerSweep } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export function providerActionCancel(deps: ProviderTypes.ProviderServiceDeps, params: ProviderTypes.ProviderCancelParams) {
  providerSweep(deps);
  const session = providerOwnedSession(deps, params);

  match(session.status)
    .with('pending', () => providerAbort(session))
    .otherwise(() => {
      throw new Errors.CONFLICT();
    });
}
