import { Errors } from '@openbots/errors/universal';
import { match } from 'ts-pattern';
import { authActionPair } from './auth-action.pair';
import type { AuthBootstrapParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionBootstrap(deps: AuthServiceDeps, { isLocal, ...params }: AuthBootstrapParams) {
  return match(isLocal)
    .with(false, () => {
      throw new Errors.UNAUTHORIZED();
    })
    .with(true, () => authActionPair(deps, { ...params, issuedBy: null }))
    .exhaustive();
}
