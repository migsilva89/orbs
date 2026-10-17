import { ModelRuntime } from '@earendil-works/pi-coding-agent';
import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import { makeStorageService } from '@openbots/runtime/native';
import { match } from 'ts-pattern';
import { makeDatabaseService } from '@openbots/server/native';
import { makeServices } from '@openbots/server/server';
import { coreCredentialsNative } from './core-credentials.native';
import { corePathsNative } from './core-paths.native';
import { coreResourceNative } from './core-resource.native';
import { coreServerNative } from './core-server.native';
import { coreToolsNative } from './core-tools.native';

export async function coreNativeRun(): Promise<void> {
  await using resources = new AsyncDisposableStack();

  const paths = await corePathsNative();

  const storage = await makeStorageService({ path: paths.runtime });
  resources.defer(() => storage.close());

  const database = makeDatabaseService({ path: paths.database });
  resources.defer(() => database.close());
  await database.migrate();

  const models = await ModelRuntime.create();
  const credentialsKey = await coreCredentialsNative(paths.data);

  const services = await makeServices({
    database,
    credentialsKey,
    resourceDriver: coreResourceNative(paths.root),
    runtime: {
      storage: storage.storage,
      models,
      env: coreToolsNative(paths.root),
    },
  });

  resources.defer(() => services.runtime.close());

  const server = coreServerNative(services);
  resources.defer(() => server.stop(true));

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
    services.runtime.closed.then((result) => match(result)
      .with({ reason: 'failed' }, ({ error }) => {
        throw error;
      })
      .otherwise(() => undefined)),
  ]);
}
