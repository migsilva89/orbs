import type { CredentialsServiceDeps } from '../../types/credentials.types';

export async function credentialsQueryList({ database }: CredentialsServiceDeps) {
  return database.db.selectFrom('credentials')
    .select(['key', 'createdAt', 'updatedAt'])
    .orderBy('key')
    .execute();
}
