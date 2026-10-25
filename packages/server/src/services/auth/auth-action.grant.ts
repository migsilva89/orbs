import { match, P } from 'ts-pattern';
import { AUTH } from './auth.constants';
import { authPinCreate, authTokenHash } from './auth.utils';
import type { AuthGrant, AuthGrantParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionGrant(deps: AuthServiceDeps, params: AuthGrantParams): Promise<AuthGrant> {
  const pin = authPinCreate();
  const pinHash = await authTokenHash(pin);
  const now = Date.now();
  const expiresAt = now + AUTH.pairingLifetime;

  const inserted = await deps.database.db.transaction().execute(async (tx) => {
    await tx.deleteFrom('pairingGrant').where('expiresAt', '<=', now).execute();

    return tx.insertInto('pairingGrant')
      .values({
        pinHash,
        issuedBy: params.issuedBy,
        expiresAt,
      })
      .onConflict((conflict) => conflict.column('pinHash').doNothing())
      .returning('pinHash')
      .executeTakeFirst();
  });

  return match(inserted)
    .with(P.nonNullable, () => ({ pin, expiresAt }))
    .otherwise(() => authActionGrant(deps, params));
}
