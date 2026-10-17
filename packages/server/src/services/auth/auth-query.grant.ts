import { Errors } from '@openbots/errors/universal';
import { authTokenHash } from './auth.utils';
import type { AuthServiceDeps, AuthTokenParams } from '../../types/auth.types';

export async function authQueryGrant({ database }: AuthServiceDeps, { token }: AuthTokenParams) {
  const grant = await database.db.selectFrom('pairingGrant')
    .select(['issuedBy', 'expiresAt', 'claimedAt'])
    .where('tokenHash', '=', await authTokenHash(token))
    .executeTakeFirst();

  if (!grant) {
    throw new Errors.NOT_FOUND({ resource: 'pairingGrant' });
  }

  return grant;
}
