import { Errors } from '@openbots/errors/universal';
import { authTokenCreate, authTokenHash } from './auth.utils';
import type { AuthRedeemParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionRedeem({ database }: AuthServiceDeps, params: AuthRedeemParams) {
  const grantHash = await authTokenHash(params.token);
  const token = authTokenCreate();
  const tokenHash = await authTokenHash(token);
  const device = { id: crypto.randomUUID(), name: params.name, createdAt: Date.now() };

  await database.db.transaction().execute(async (tx) => {
    const grant = await tx.deleteFrom('pairingGrant')
      .where('tokenHash', '=', grantHash)
      .where('expiresAt', '>', Date.now())
      .returning('tokenHash')
      .executeTakeFirst();

    if (!grant) {
      throw new Errors.UNAUTHORIZED();
    }

    await tx.insertInto('device').values({ ...device, tokenHash }).execute();
  });

  return { device, token };
}
