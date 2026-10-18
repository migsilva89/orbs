import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';

export async function credentialsKeyNative(directory: string): Promise<CryptoKey> {
  const path = join(directory, 'credentials.key');
  let bytes: Uint8Array;

  try {
    bytes = await readFile(path);
  } catch (error) {
    bytes = await match(error)
      .with({ code: 'ENOENT' }, async () => {
        const key = crypto.getRandomValues(new Uint8Array(32));

        try {
          await writeFile(path, key, { mode: 0o600, flag: 'wx' });
        } catch (cause) {
          match(cause)
            .with({ code: 'EEXIST' }, () => undefined)
            .otherwise(() => {
              throw cause;
            });
        }

        return readFile(path);
      })
      .otherwise(() => {
        throw error;
      });
  }

  return crypto.subtle.importKey('raw', Uint8Array.from(bytes), 'AES-GCM', false, ['encrypt', 'decrypt']);
}
