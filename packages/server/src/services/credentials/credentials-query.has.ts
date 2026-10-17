import type { CredentialsGetParams, CredentialsServiceDeps } from '../../types/credentials.types';

export async function credentialsQueryHas({ database }: CredentialsServiceDeps, params: CredentialsGetParams): Promise<boolean> {
  const stored = await database.db.selectFrom('credentials').select('key').where('key', '=', params.key).executeTakeFirst();
  return stored !== undefined;
}
