import type { AuthRevokeParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionRevoke({ database }: AuthServiceDeps, { id }: AuthRevokeParams): Promise<void> {
  await database.db.deleteFrom('device').where('id', '=', id).execute();
}
