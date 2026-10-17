import { env } from '@openbots/env/server';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { makeDatabaseService } from '@openbots/server/native';
import { makeAuthService } from '@openbots/server/server';

export async function corePairNative(): Promise<void> {
  await mkdir(env.OPENBOTS_DATA_DIR, { recursive: true });
  const database = makeDatabaseService({ path: join(env.OPENBOTS_DATA_DIR, 'app.sqlite') });

  try {
    await database.migrate();
    const auth = makeAuthService({ database });
    const grant = await auth.actions.grant({ issuedBy: null });
    process.stdout.write(`${JSON.stringify(grant)}\n`);
  } finally {
    database.close();
  }
}
