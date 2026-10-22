import { CredentialSynchronizationError } from '@earendil-works/pi-coding-agent';
import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { providerAbort, providerSweep } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export async function providerActionLogout(
  deps: ProviderTypes.ProviderServiceDeps,
  { providerId }: ProviderTypes.ProviderLogoutParams,
) {
  providerSweep(deps);

  for (const session of deps.sessions.values()) {
    match(session.providerId === providerId && session.status === 'pending')
      .with(true, () => providerAbort(session))
      .with(false, () => undefined)
      .exhaustive();
  }

  try {
    await deps.models.logout(providerId);
  } catch (error) {
    match(error)
      .with(P.instanceOf(CredentialSynchronizationError), () => undefined)
      .otherwise(() => {
        throw new Errors.INTERNAL_ERROR({ internal: 'Provider logout failed.', cause: error });
      });
  }
}
