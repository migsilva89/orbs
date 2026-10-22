import { Errors } from '@repo/errors/universal';
import { chmod, lstat, mkdir, unlink } from 'node:fs/promises';
import { join } from 'node:path';
import { match } from 'ts-pattern';
import { coreRpcNative } from './core-rpc.native';
import type { CoreLocalNativeParams } from '../types/core.types';
import type { makeServices } from '@repo/server/server';

const IPC_DIRECTORY_MODE = 0o700;
const IPC_SOCKET_MODE = 0o600;
const IPC_SOCKET_NAME = 'rpc.sock';

export async function coreLocalNative(
  services: Awaited<ReturnType<typeof makeServices>>,
  { directory }: CoreLocalNativeParams,
) {
  await coreLocalNativeDirectory(directory);
  const unix = join(directory, IPC_SOCKET_NAME);
  await coreLocalNativeSocket(unix);
  const rpc = coreRpcNative(services, { isLocal: true });

  const server = Bun.serve({
    unix,
    maxRequestBodySize: 16 * 1024,
    fetch(request) {
      const url = new URL(request.url);

      return match({
        hasOrigin: request.headers.has('origin'),
        path: url.pathname,
        method: request.method,
      })
        .with({ hasOrigin: true }, () => new Response(null, { status: 403 }))
        .with({ path: '/rpc/pairing/bootstrap', method: 'POST' }, () => rpc.http.handle(request, {
          prefix: '/rpc',
          context: rpc.context,
        }).then((result) => match(result)
          .with({ matched: true }, ({ response }) => {
            response.headers.set('Cache-Control', 'no-store');
            response.headers.set('X-Content-Type-Options', 'nosniff');

            return response;
          })
          .with({ matched: false }, () => new Response(null, { status: 404 }))
          .exhaustive()))
        .otherwise(() => new Response(null, { status: 404 }));
    },
  });

  try {
    await chmod(unix, IPC_SOCKET_MODE);
  } catch (error) {
    await server.stop(true);
    throw error;
  }

  return server;
}

async function coreLocalNativeDirectory(directory: string): Promise<void> {
  await mkdir(directory, { recursive: true, mode: IPC_DIRECTORY_MODE });
  const stats = await lstat(directory);

  match(stats.isDirectory())
    .with(false, () => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Local IPC path must be a directory' });
    })
    .with(true, () => undefined)
    .exhaustive();

  await chmod(directory, IPC_DIRECTORY_MODE);
  const verified = await lstat(directory);

  match({
    isDirectory: verified.isDirectory(),
    mode: verified.mode & 0o777,
    isOwner: verified.uid === process.getuid?.(),
  })
    .with({
      isDirectory: true,
      mode: IPC_DIRECTORY_MODE,
      isOwner: true,
    }, () => undefined)
    .otherwise(() => {
      throw new Errors.INTERNAL_ERROR({ internal: 'Local IPC directory must be owner-only' });
    });
}

async function coreLocalNativeSocket(path: string): Promise<void> {
  try {
    const stats = await lstat(path);

    await match(stats.isSocket())
      .with(true, () => unlink(path))
      .with(false, () => {
        throw new Errors.INTERNAL_ERROR({ internal: 'Local IPC path exists and is not a socket' });
      })
      .exhaustive();
  } catch (error) {
    match(error)
      .with({ code: 'ENOENT' }, () => undefined)
      .otherwise(() => {
        throw error;
      });
  }
}
