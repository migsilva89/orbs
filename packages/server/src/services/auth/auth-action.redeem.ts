import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { authTokenCreate, authTokenHash } from './auth.utils';
import type { AuthServiceDeps } from '../../types/auth.types';
import type { AuthRedeemInput } from '@openbots/contracts/universal';

export async function authActionRedeem({ database }: AuthServiceDeps, params: AuthRedeemInput) {
  const grantHash = await authTokenHash(params.token);
  const token = authTokenCreate();
  const tokenHash = await authTokenHash(token);

  const device = await database.db.transaction().execute(async (tx) => {
    const claimedAt = Date.now();
    const existing = await tx.selectFrom('device').select('id').limit(1).executeTakeFirst();

    match(await tx.updateTable('pairingGrant')
      .set({ claimedAt })
      .where('tokenHash', '=', grantHash)
      .where('expiresAt', '>', claimedAt)
      .where('claimedAt', 'is', null)
      .returning('tokenHash')
      .executeTakeFirst())
      .with(P.nonNullable, (value) => value)
      .otherwise(() => {
        throw new Errors.UNAUTHORIZED();
      });

    const paired = { id: crypto.randomUUID(), name: params.name, createdAt: claimedAt };
    await tx.insertInto('device').values({ ...paired, tokenHash }).execute();

    await match(existing)
      .with(undefined, () => tx.deleteFrom('pairingGrant').where('issuedBy', 'is', null).where('claimedAt', 'is', null).execute())
      .otherwise(() => undefined);

    return paired;
  });

  return { device, token };
}
