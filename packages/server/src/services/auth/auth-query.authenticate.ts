import { authToken } from '@repo/contracts/universal';
import { Errors } from '@repo/errors/universal';
import { match } from 'ts-pattern';
import { authQueryDevice } from './auth-query.device';
import type { AuthAuthenticateParams, AuthServiceDeps } from '../../types/auth.types';

export async function authQueryAuthenticate(deps: AuthServiceDeps, { authorization }: AuthAuthenticateParams) {
  const bearer = /^Bearer (.+)$/i.exec(authorization ?? '');
  const token = authToken.safeParse(bearer?.[1]);

  return match(token)
    .with({ success: true }, ({ data }) => authQueryDevice(deps, { token: data }))
    .with({ success: false }, () => {
      throw new Errors.UNAUTHORIZED();
    })
    .exhaustive();
}
