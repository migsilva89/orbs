import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { providerIsCurrent, providerSessionView } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export function providerQuerySession(deps: ProviderTypes.ProviderServiceDeps, params: ProviderTypes.ProviderSessionParams) {
  return match(deps.sessions.get(params.id))
    .with({ deviceId: params.deviceId }, (session) => match(providerIsCurrent(session))
      .with(true, () => providerSessionView(session))
      .with(false, () => {
        throw new Errors.NOT_FOUND({ resource: 'session', resourceId: params.id });
      })
      .exhaustive())
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'session', resourceId: params.id });
    });
}
