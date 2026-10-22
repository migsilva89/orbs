import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import {
  makeAlarmService,
  makeImageService,
  makeInstructionLoaderService,
  makeMcpAuthService,
  makeMcpClientService,
  makePluginLoaderService,
  makeProviderService,
  makeSkillLoaderService,
  makeStorageLockService,
  makeStorageService,
  runtimeEnvNative,
} from '@openbots/runtime/native';
import { makeSecretBrokerService, makeSecretProxyService } from '@openbots/secret-proxy/native';
import { join } from 'node:path';
import { credentialsKeyNative, makeAttachmentStorageService, makeAvatarImageService, makeDatabaseService, makeMcpService, makeWorkspaceService, workspacePathsNative } from '@openbots/server/native';
import { makeCredentialsService, makeSecretService, makeServices, makeSettingsService } from '@openbots/server/server';
import { coreLocalNative } from './core-local.native';
import { corePairingNative } from './core-pairing.native';
import { coreServerNative } from './core-server.native';

const STOP_SIGNALS = ['SIGINT', 'SIGTERM'] as const;

export async function coreNativeRun(): Promise<void> {
  await using resources = new AsyncDisposableStack();

  const stopped = coreNativeSignals(resources);
  const { paths, services } = await coreNativeServices(resources);

  const server = coreServerNative(services);
  resources.defer(() => server.stop(true));

  const local = await coreLocalNative(services, { directory: join(paths.data, 'ipc') });
  resources.defer(() => local.stop(true));

  log.info({
    tag: 'daemon',
    message: 'Daemon started',
    host: env.OPENBOTS_HOST,
    port: server.port,
  });

  resources.defer(corePairingNative(services));
  process.send?.('openbots:ready');

  await stopped;
}

function coreNativeSignals(resources: AsyncDisposableStack): Promise<void> {
  return new Promise((resolve) => {
    const stop = (): void => resolve();

    for (const signal of STOP_SIGNALS) {
      process.once(signal, stop);
    }

    resources.defer(() => {
      for (const signal of STOP_SIGNALS) {
        process.off(signal, stop);
      }
    });
  });
}

async function coreNativeServices(resources: AsyncDisposableStack) {
  const paths = await workspacePathsNative(env.OPENBOTS_DATA_DIR);

  const lock = await makeStorageLockService({ path: paths.lock });
  resources.defer(() => lock.close());
  const alarm = makeAlarmService();
  resources.defer(() => alarm.close());

  const database = makeDatabaseService({ path: paths.database });
  resources.defer(() => database.close());
  await database.migrate();

  const providers = await makeProviderService();
  resources.defer(() => providers.close());
  const credentialsKey = await credentialsKeyNative(paths.data);
  const credentials = makeCredentialsService({ database, key: credentialsKey });
  const mcpAuth = makeMcpAuthService({ credentials });
  resources.defer(() => mcpAuth.close());
  const settings = makeSettingsService({ database });
  const secrets = makeSecretService({ credentials, settings });

  const secretsFolder = join(paths.data, 'secrets');
  const secretProxy = makeSecretProxyService({ source: secrets, folder: secretsFolder });
  resources.defer(() => secretProxy.actions.stop());

  const secretBroker = makeSecretBrokerService({
    source: secrets,
    proxy: secretProxy,
    folder: secretsFolder,
    varlock: Bun.which('varlock'),
  });

  const mcpClients = makeMcpClientService({ root: paths.root, auth: mcpAuth });
  resources.defer(() => mcpClients.close());

  const services = await makeServices({
    database,
    attachmentStorage: makeAttachmentStorageService({ root: paths.root }),
    avatarImages: makeAvatarImageService({ root: join(paths.data, 'avatars') }),
    credentials,
    secrets,
    settings,
    workspace: makeWorkspaceService({ root: paths.root }),
    skillLoader: makeSkillLoaderService({ root: paths.root }),
    instructionLoader: makeInstructionLoaderService({ root: paths.root }),
    pluginLoader: makePluginLoaderService({ root: paths.root }),
    mcp: makeMcpService({
      root: paths.root,
      settings,
      clients: mcpClients,
      credentials,
    }),
    mcpAuth,
    providers,
    runtime: {
      storage: makeStorageService({ root: paths.bots }),
      alarm,
      models: providers.models,
      env: runtimeEnvNative(paths.root),
      images: await makeImageService(),
      secrets: secretBroker,
    },
  });

  resources.defer(() => services.runtime.close());
  resources.defer(await services.notifications.actions.watch());

  return { paths, services };
}
