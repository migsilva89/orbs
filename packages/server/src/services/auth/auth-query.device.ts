import { Errors } from '@openbots/errors/universal';
import { authTokenHash } from './auth.utils';
import type { AuthServiceDeps, AuthTokenParams } from '../../types/auth.types';

export async function authQueryDevice({ database }: AuthServiceDeps, { token }: AuthTokenParams) {
  const device = await database.db.selectFrom('device')
    .select(['id', 'name', 'createdAt'])
    .where('tokenHash', '=', await authTokenHash(token))
    .executeTakeFirst();

  if (!device) {
    throw new Errors.UNAUTHORIZED();
  }

  return device;
}
