import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import { makeStorageService } from '@openbots/runtime/native';
import { join } from 'node:path';
import { makeDatabaseService } from '@openbots/server/native';
import { coreHandler, makeServices } from '@openbots/server/server';

export async function coreNativeRun(): Promise<void> {
  await using resources = new AsyncDisposableStack();

  const storage = await makeStorageService({ path: join(env.OPENBOTS_DATA_DIR, 'runtime.sqlite') });
  resources.defer(() => storage.close());

  const database = makeDatabaseService({ path: join(env.OPENBOTS_DATA_DIR, 'app.sqlite') });
  resources.defer(() => database.close());
  await database.migrate();

  const services = await makeServices({ storage: storage.storage, database });
  resources.defer(() => services.conversation.close());

  const server = Bun.serve({
    hostname: env.OPENBOTS_HOST,
    port: env.OPENBOTS_PORT,
    maxRequestBodySize: 16 * 1024,
    fetch: (request) => coreHandler(services.auth, request),
  });

  resources.defer(() => server.stop());

  const stopped = Promise.withResolvers<undefined>();
  const stop = (): void => stopped.resolve(undefined);

  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  resources.defer(() => {
    process.off('SIGINT', stop);
    process.off('SIGTERM', stop);
  });

  log.info({
    tag: 'daemon',
    message: 'Daemon started',
    host: env.OPENBOTS_HOST,
    port: server.port,
  });

  await Promise.race([
    stopped.promise,
    services.conversation.closed.then((result) => {
      if (result.reason === 'failed') {
        throw result.error;
      }
    }),
  ]);
}
