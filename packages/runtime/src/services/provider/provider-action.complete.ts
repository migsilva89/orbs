import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { providerOwnedSession, providerSessionView, providerSweep } from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';

export function providerActionComplete(deps: ProviderTypes.ProviderServiceDeps, params: ProviderTypes.ProviderCompleteParams) {
  providerSweep(deps);
  const session = providerOwnedSession(deps, params);

  return match(session)
    .with({ status: 'pending', pending: P.nonNullable }, (current) => match(current.pending.promptId === params.promptId)
      .with(true, () => {
        current.pending.resolve(params.answer);
        return providerSessionView(current);
      })
      .with(false, () => {
        throw new Errors.CONFLICT();
      })
      .exhaustive())
    .otherwise(() => {
      throw new Errors.CONFLICT();
    });
}
