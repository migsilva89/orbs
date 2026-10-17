import { match, P } from 'ts-pattern';
import { credentialsDecode } from './credentials.utils';
import type { CredentialsGetParams, CredentialsServiceDeps } from '../../types/credentials.types';

export async function credentialsQueryGet({ database, key }: CredentialsServiceDeps, params: CredentialsGetParams): Promise<string | null> {
  const stored = await database.db.selectFrom('credentials').select(['value', 'iv']).where('key', '=', params.key).executeTakeFirst();

  return match(stored)
    .with(P.nonNullable, async ({ value, iv }) => {
      const decrypted = await crypto.subtle.decrypt({
        name: 'AES-GCM',
        iv: credentialsDecode(iv),
        additionalData: new TextEncoder().encode(params.key),
      }, key, credentialsDecode(value));

      return new TextDecoder().decode(decrypted);
    })
    .otherwise(() => null);
}
