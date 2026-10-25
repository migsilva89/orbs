import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { AUTH } from './auth.constants';
import { authTokenCreate, authTokenHash } from './auth.utils';
import type { AuthServiceDeps } from '../../types/auth.types';
import type { AuthRedeemInput } from '@repo/contracts/universal';

export async function authActionRedeem({ database }: AuthServiceDeps, params: AuthRedeemInput) {
  const pinHash = await authTokenHash(params.pin);
  const token = authTokenCreate();
  const tokenHash = await authTokenHash(token);

  const device = await database.db.transaction().execute(async (tx) => {
    const claimedAt = Date.now();
    const existing = await tx.selectFrom('device').select('id').limit(1).executeTakeFirst();

    const grant = await tx.deleteFrom('pairingGrant')
      .where('pinHash', '=', pinHash)
      .where('expiresAt', '>', claimedAt)
      .returning('pinHash')
      .executeTakeFirst();

    if (!grant) {
      return null;
    }

    const paired = { id: crypto.randomUUID(), name: params.name, createdAt: claimedAt };
    await tx.insertInto('device').values({ ...paired, tokenHash }).execute();

    await match(existing)
      .with(undefined, () => tx.deleteFrom('pairingGrant').where('issuedBy', 'is', null).execute())
      .otherwise(() => undefined);

    return paired;
  });

  return match(device)
    .with(P.nonNullable, (paired) => ({ device: paired, token }))
    .otherwise(async () => {
      await database.db.transaction().execute(async (tx) => {
        await tx.updateTable('pairingGrant')
          .set((eb) => ({ failedAttempts: eb('failedAttempts', '+', 1) }))
          .where('expiresAt', '>', Date.now())
          .execute();
        await tx.deleteFrom('pairingGrant').where('failedAttempts', '>=', AUTH.pinFailedAttempts).execute();
      });

      throw new Errors.UNAUTHORIZED();
    });
}
