import { env } from '@openbots/env/server';
import { isIP } from 'node:net';
import { match, P } from 'ts-pattern';
import { coreHandler } from '@openbots/server/server';
import { coreRpcNative } from './core-rpc.native';
import type { CoreServerAvatarParams } from '../types/core.types';
import type { makeServices } from '@openbots/server/server';

const CORE_SERVER_AVATAR = /^\/avatars\/(bots\/)?([\da-f-]{36})\.(png|webp)$/u;

export function coreServerNative(services: Awaited<ReturnType<typeof makeServices>>) {
  const rpc = coreRpcNative(services);

  return Bun.serve({
    hostname: env.OPENBOTS_HOST,
    port: env.OPENBOTS_PORT,
    maxRequestBodySize: 12 * 1024 * 1024,
    fetch(request, server) {
      const url = new URL(request.url);

      return match({
        path: url.pathname,
        isAllowedOrigin: coreServerAllowedOrigin(request),
        method: request.method,
      })
        .with({ path: P.union('/rpc', P.string.startsWith('/rpc/')), isAllowedOrigin: false }, () => (
          new Response(null, { status: 403 })
        ))
        .with({ path: P.union('/rpc', P.string.startsWith('/rpc/')), method: P.union('POST', 'OPTIONS') }, () => rpc.http.handle(request, {
          prefix: '/rpc',
          context: { ...rpc.context, peerAddress: server.requestIP(request)?.address ?? null },
        }).then((result) => match(result)
          .with({ matched: true }, ({ response }) => {
            response.headers.set('Cache-Control', 'no-store');
            response.headers.set('X-Content-Type-Options', 'nosniff');

            return response;
          })
          .with({ matched: false }, () => new Response(null, { status: 404 }))
          .exhaustive()))
        .with({ path: P.string.startsWith('/files/'), isAllowedOrigin: false }, () => new Response(null, { status: 403 }))
        .with({ path: P.string.startsWith('/files/'), method: P.union('GET', 'OPTIONS') }, () => rpc.files.handle(request, {
          prefix: '/files',
          context: { ...rpc.context, peerAddress: server.requestIP(request)?.address ?? null },
        }).then((result) => match(result)
          .with({ matched: true }, ({ response }) => {
            response.headers.set('Cache-Control', response.ok ? 'private, max-age=31536000, immutable' : 'no-store');
            response.headers.set('X-Content-Type-Options', 'nosniff');

            return response;
          })
          .with({ matched: false }, () => new Response(null, { status: 404 }))
          .exhaustive()))
        .with({ path: P.string.regex(CORE_SERVER_AVATAR), method: 'GET' }, () => coreServerAvatar({
          services,
          path: url.pathname,
          peer: server.requestIP(request)?.address ?? null,
        }))
        .with({ path: '/rpc', method: 'GET' }, () => match(server.upgrade(request, { data: undefined }))
          .with(true, () => undefined)
          .with(false, () => new Response(null, { status: 426 }))
          .exhaustive())
        .otherwise(() => coreHandler(request));
    },
    websocket: {
      maxPayloadLength: 1024 * 1024,
      backpressureLimit: 4 * 1024 * 1024,
      closeOnBackpressureLimit: true,
      async message(socket, message) {
        await rpc.websocket.message(socket, message, {
          context: { ...rpc.context, peerAddress: socket.remoteAddress },
        });
      },
      async close(socket) {
        await rpc.websocket.close(socket);
      },
    },
  });
}

function coreServerAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');

  return match(origin)
    .with(null, () => true)
    .otherwise((value) => {
      const hostname = URL.parse(value)?.hostname.replace(/^\[|\]$/gu, '') ?? '';

      return env.OPENBOTS_ALLOWED_ORIGINS.includes(URL.parse(value)?.origin ?? value)
        || isIP(hostname) !== 0
        || hostname === 'localhost'
        || hostname.endsWith('.localhost');
    });
}

async function coreServerAvatar({ services, path, peer }: CoreServerAvatarParams): Promise<Response> {
  const [, folder, id, extension] = CORE_SERVER_AVATAR.exec(path) ?? [];

  try {
    await services.limits.throttle({ kind: 'public', peer });

    const bytes = await match({ folder, extension })
      .with({ folder: 'bots/', extension: 'png' }, () => services.avatars.queries.bot({ botId: id }))
      .otherwise(() => services.avatars.queries.image({ imageId: id }));

    return new Response(new Uint8Array(bytes), {
      headers: {
        'Content-Type': extension === 'png' ? 'image/png' : 'image/webp',
        'Cache-Control': folder ? 'no-cache' : 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return match(error)
      .with({ code: 'NOT_FOUND' }, () => new Response(null, { status: 404 }))
      .with({ code: 'RATE_LIMITED' }, () => new Response(null, { status: 429 }))
      .otherwise(() => {
        throw error;
      });
  }
}
