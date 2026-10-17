import { match, P } from 'ts-pattern';
import { credentialsEncode } from './credentials.utils';
import type { CredentialsServiceDeps, CredentialsSetParams } from '../../types/credentials.types';

export async function credentialsActionSet({ database, key }: CredentialsServiceDeps, params: CredentialsSetParams): Promise<void> {
  await match(params.value)
    .with(null, () => database.db.deleteFrom('credentials').where('key', '=', params.key).execute())
    .with(P.string, async (value) => {
      const encoder = new TextEncoder();
      const iv = crypto.getRandomValues(new Uint8Array(12));

      const encrypted = await crypto.subtle.encrypt({
        name: 'AES-GCM',
        iv,
        additionalData: encoder.encode(params.key),
      }, key, encoder.encode(value));

      const now = Date.now();
      const saved = { value: credentialsEncode(new Uint8Array(encrypted)), iv: credentialsEncode(iv), updatedAt: now };

      await database.db.insertInto('credentials')
        .values({
          key: params.key,
          ...saved,
          createdAt: now,
        })
        .onConflict((conflict) => conflict.column('key').doUpdateSet(saved))
        .execute();
    })
    .exhaustive();
}
