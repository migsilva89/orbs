import { env } from '@repo/env/server';
import { initNativeLogger, log } from '@repo/logger/server';
import { resolve } from 'node:path';
import { match, P } from 'ts-pattern';
import { makeBackupService, workspacePathsRootNative } from '@repo/server/native';

initNativeLogger(env.LOG_LEVEL);

const args = process.argv.slice(2);
const [command, path] = args;
const backup = makeBackupService({ root: workspacePathsRootNative(env.DATA_DIR) });

const run = match(args)
  .with(['create', P.string], ([, destination]) => () => backup.actions.create({ destination: resolve(destination) }))
  .with(['restore', P.string], ([, bundle]) => () => backup.actions.restore({ bundle: resolve(bundle) }))
  .otherwise(() => null);

await match(run)
  .with(null, () => {
    process.exitCode = 1;
    log.error({
      tag: 'backup',
      message: 'Usage: bun run --cwd apps/daemon backup create <new-directory> | bun run --cwd apps/daemon backup restore <backup-directory>',
    });
  })
  .otherwise(async (action) => {
    try {
      await action();
      log.info({
        tag: 'backup',
        message: `Backup ${command} finished`,
        path,
      });
    } catch (error) {
      process.exitCode = 1;
      log.error({
        tag: 'backup',
        message: `Backup ${command} failed`,
        error,
      });
    }
  });
