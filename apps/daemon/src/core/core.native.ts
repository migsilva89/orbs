import { ModelRuntime } from '@earendil-works/pi-coding-agent';
import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import { makeMcpClientService, makeSkillLoaderService, makeStorageService, runtimeEnvNative } from '@openbots/runtime/native';
import { match } from 'ts-pattern';
import { credentialsKeyNative, makeDatabaseService, makeMcpService, makeWorkspaceService, workspacePathsNative } from '@openbots/server/native';
import { makeServices, makeSettingsService } from '@openbots/server/server';
import { coreServerNative } from './core-server.native';

export async function coreNativeRun(): Promise<void> {
  await using resources = new AsyncDisposableStack();

  const paths = await workspacePathsNative(env.OPENBOTS_DATA_DIR);

  const storage = await makeStorageService({ path: paths.runtime });
  resources.defer(() => storage.close());

  const database = makeDatabaseService({ path: paths.database });
  resources.defer(() => database.close());
  await database.migrate();

  const models = await ModelRuntime.create();
  const credentialsKey = await credentialsKeyNative(paths.data);
  const settings = makeSettingsService({ database });
  const workspace = makeWorkspaceService({ root: paths.root });
  const skillLoader = makeSkillLoaderService({ root: paths.root });
  const mcpClients = makeMcpClientService({ root: paths.root });
  resources.defer(() => mcpClients.close());

  const mcp = makeMcpService({
    root: paths.root,
    settings,
    clients: mcpClients,
  });

  const services = await makeServices({
    database,
    credentialsKey,
    settings,
    workspace,
    skillLoader,
    mcp,
    runtime: {
      storage: storage.storage,
      models,
      env: runtimeEnvNative(paths.root),
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
