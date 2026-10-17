import type { AuthServiceDeps } from '../../types/auth.types';

export function authQueryDevices({ database }: AuthServiceDeps) {
  return database.db.selectFrom('device').select(['id', 'name', 'createdAt']).orderBy('createdAt').orderBy('id').execute();
}
