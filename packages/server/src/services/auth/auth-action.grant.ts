import { AUTH } from './auth.constants';
import { authTokenCreate, authTokenHash } from './auth.utils';
import type { AuthGrantParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionGrant({ database }: AuthServiceDeps, { issuedBy }: AuthGrantParams) {
  const token = authTokenCreate();
  const tokenHash = await authTokenHash(token);
  const now = Date.now();
  const expiresAt = now + AUTH.pairingLifetime;

  await database.db.transaction().execute(async (tx) => {
    await tx.deleteFrom('pairingGrant').where('expiresAt', '<=', now).where('claimedAt', 'is', null).execute();
    await tx.insertInto('pairingGrant').values({
      tokenHash,
      issuedBy,
      expiresAt,
      claimedAt: null,
    }).execute();
  });

  return { token, expiresAt };
}
