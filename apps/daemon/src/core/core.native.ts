import { ModelRuntime } from '@earendil-works/pi-coding-agent';
import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import {
  makeInstructionLoaderService,
  makeMcpClientService,
  makePluginLoaderService,
  makeSkillLoaderService,
  makeStorageService,
  runtimeEnvNative,
} from '@openbots/runtime/native';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import { credentialsKeyNative, makeAttachmentStorageService, makeDatabaseService, makeMcpService, makeWorkspaceService, workspacePathsNative } from '@openbots/server/native';
import { makeCredentialsService, makeServices, makeSettingsService } from '@openbots/server/server';
import { coreLocalNative } from './core-local.native';
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
  const credentials = makeCredentialsService({ database, key: credentialsKey });
  const settings = makeSettingsService({ database });
  const workspace = makeWorkspaceService({ root: paths.root });
  const skillLoader = makeSkillLoaderService({ root: paths.root });
  const instructionLoader = makeInstructionLoaderService({ root: paths.root });
  const pluginLoader = makePluginLoaderService({ root: paths.root });
  const mcpClients = makeMcpClientService({ root: paths.root });
  resources.defer(() => mcpClients.close());

  const mcp = makeMcpService({
    root: paths.root,
    settings,
    clients: mcpClients,
    credentials,
  });

  const services = await makeServices({
    database,
    attachmentStorage: makeAttachmentStorageService({ root: paths.root }),
    credentials,
    settings,
    workspace,
    skillLoader,
    instructionLoader,
    pluginLoader,
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

  const local = await coreLocalNative(services, { directory: join(paths.data, 'ipc') });
  resources.defer(() => local.stop(true));

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
