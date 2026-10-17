import { makeDatabaseService } from '@openbots/server/native';
import { makeAuthService } from '@openbots/server/server';
import { corePathsNative } from './core-paths.native';

export async function corePairNative(): Promise<void> {
  const paths = await corePathsNative();
  const database = makeDatabaseService({ path: paths.database });

  try {
    await database.migrate();
    const auth = makeAuthService({ database });
    const grant = await auth.actions.grant({ issuedBy: null });
    process.stdout.write(`${JSON.stringify(grant)}\n`);
  } finally {
    database.close();
  }
}
