import { authPair, SERVER_PROTOCOL } from '@openbots/contracts/universal';
import { env } from '@openbots/env/server';
import { Errors } from '@openbots/errors/universal';
import { log } from '@openbots/logger/server';
import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { realpathSync } from 'node:fs';
import { mkdir, open, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { match } from 'ts-pattern';
import { renderUnicodeCompact } from 'uqr';
import { workspacePathsRootNative } from '@openbots/server/native';
import type { router } from '@openbots/server/server';
import type { RouterClient } from '@orpc/server';

const HELP = `Usage:
  openbots start [--detach]
  openbots pair [--url <origin>]
  openbots service register
  openbots service unregister

Without a command, the daemon starts in the foreground.
Service commands change startup at the next macOS login, not the running daemon.
`;

const ENTRY = realpathSync(process.argv[1]);
const ROOT = workspacePathsRootNative(env.OPENBOTS_DATA_DIR);
const LOG = join(ROOT, 'data', 'daemon.log');

export async function coreCommandNative(): Promise<void> {
  const { positionals, values } = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      detach: { type: 'boolean' },
      url: { type: 'string' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  await match({
    command: positionals,
    detach: values.detach,
    url: values.url,
    help: values.help,
  })
    .with({ help: true }, () => process.stdout.write(HELP))
    .with({ command: ['help'] }, () => process.stdout.write(HELP))
    .with({ command: [], url: undefined }, { command: ['start'], url: undefined }, async () => {
      await match(values.detach ?? false)
        .with(true, coreCommandDetachNative)
        .with(false, async () => {
          const { coreNativeRun } = await import('./core.native');
          await coreNativeRun();
          log.info({ tag: 'daemon', message: 'Daemon stopped' });
        })
        .exhaustive();
    })
    .with({ command: ['pair'], detach: undefined }, () => coreCommandPairNative(values.url))
    .with({
      command: ['service', 'register'],
      detach: undefined,
      url: undefined,
    }, () => coreCommandServiceNative('register'))
    .with({
      command: ['service', 'unregister'],
      detach: undefined,
      url: undefined,
    }, () => coreCommandServiceNative('unregister'))
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: HELP });
    });
}

async function coreCommandPairNative(url = env.OPENBOTS_PUBLIC_URL): Promise<void> {
  const { serverUrl } = authPair.parse({ serverUrl: url });
  const unix = join(ROOT, 'data', 'ipc', 'rpc.sock');

  const client = createORPCClient<RouterClient<typeof router>>(new RPCLink({
    origin: 'http://localhost',
    url: '/rpc',
    headers: { [SERVER_PROTOCOL.versionHeader]: String(SERVER_PROTOCOL.version) },
    fetch: (request, init) => fetch(request, { ...init, unix }),
  }));

  const { qr } = await client.pairing.bootstrap({ serverUrl });
  const link = new URL(`/connect#code=${encodeURIComponent(qr.payload)}`, serverUrl).href;
  process.stdout.write(`${qr.payload}\n\n${link}\n\n${renderUnicodeCompact(link)}\n`);
}

async function coreCommandDetachNative(): Promise<void> {
  await mkdir(dirname(LOG), { recursive: true, mode: 0o700 });
  const output = await open(LOG, 'a', 0o600);

  try {
    const child = spawn(process.execPath, [ENTRY, 'start'], {
      detached: true,
      stdio: ['ignore', output.fd, output.fd, 'ipc'],
    });

    await new Promise<void>((ready, reject) => {
      child.once('error', reject);
      child.once('exit', () => reject(new Errors.INTERNAL_ERROR({ internal: `Daemon failed to start. See ${LOG}` })));
      child.once('message', (message) => {
        match(message)
          .with('openbots:ready', () => ready())
          .otherwise(() => reject(new Errors.INTERNAL_ERROR({ internal: `Unexpected daemon startup response. See ${LOG}` })));
      });
    });

    child.disconnect();
    child.unref();
    log.info({
      tag: 'daemon',
      message: 'Daemon started in the background',
      pid: child.pid,
      log: LOG,
    });
  } finally {
    await output.close();
  }
}

async function coreCommandServiceNative(command: 'register' | 'unregister'): Promise<void> {
  match(process.platform)
    .with('darwin', () => undefined)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Login services are supported on macOS only.' });
    });

  const id = createHash('sha256').update(ROOT).digest('hex').slice(0, 12);
  const label = `app.openbots.daemon.${id}`;
  const path = join(homedir(), 'Library', 'LaunchAgents', `${label}.plist`);

  await match(command)
    .with('unregister', async () => {
      await rm(path, { force: true });
      log.info({
        tag: 'daemon',
        message: 'Login startup disabled; the running daemon is unchanged',
        path,
      });
    })
    .with('register', async () => {
      const agent = {
        Label: label,
        ProgramArguments: [process.execPath, ENTRY, 'start'],
        WorkingDirectory: resolve(import.meta.dirname, '../..'),
        EnvironmentVariables: {
          ...Object.fromEntries(Object.entries(env).map(([key, value]) => [key, String(value)])),
          OPENBOTS_DATA_DIR: ROOT,
          PATH: process.env.PATH ?? '/usr/bin:/bin:/usr/sbin:/sbin',
        },
        RunAtLoad: true,
        StandardOutPath: LOG,
        StandardErrorPath: LOG,
        Umask: 0o077,
      };

      const result = Bun.spawnSync(['/usr/bin/plutil', '-convert', 'xml1', '-o', '-', '-'], {
        stdin: Buffer.from(JSON.stringify(agent)),
      });

      match(result.exitCode)
        .with(0, () => undefined)
        .otherwise(() => {
          throw new Errors.INTERNAL_ERROR({ internal: result.stderr.toString() });
        });

      await mkdir(dirname(LOG), { recursive: true, mode: 0o700 });
      await mkdir(dirname(path), { recursive: true, mode: 0o700 });
      await writeFile(path, result.stdout, { mode: 0o600 });
      log.info({
        tag: 'daemon',
        message: 'Login startup enabled for the next login; the running daemon is unchanged',
        path,
      });
    })
    .exhaustive();
}
