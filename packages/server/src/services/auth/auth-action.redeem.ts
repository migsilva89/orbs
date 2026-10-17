import { Errors } from '@openbots/errors/universal';
import { authTokenCreate, authTokenHash } from './auth.utils';
import type { AuthRedeemParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionRedeem({ database }: AuthServiceDeps, params: AuthRedeemParams) {
  const grantHash = await authTokenHash(params.token);
  const token = authTokenCreate();
  const tokenHash = await authTokenHash(token);

  const device = await database.db.transaction().execute(async (tx) => {
    const claimedAt = Date.now();

    const grant = await tx.updateTable('pairingGrant')
      .set({ claimedAt })
      .where('tokenHash', '=', grantHash)
      .where('expiresAt', '>', claimedAt)
      .where('claimedAt', 'is', null)
      .returning('tokenHash')
      .executeTakeFirst();

    if (!grant) {
      throw new Errors.UNAUTHORIZED();
    }

    const paired = { id: crypto.randomUUID(), name: params.name, createdAt: claimedAt };
    await tx.insertInto('device').values({ ...paired, tokenHash }).execute();

    return paired;
  });

  return { device, token };
}
