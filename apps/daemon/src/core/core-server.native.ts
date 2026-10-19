import { env } from '@openbots/env/server';
import { match, P } from 'ts-pattern';
import { coreHandler } from '@openbots/server/server';
import { coreRpcNative } from './core-rpc.native';
import type { makeServices } from '@openbots/server/server';

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
        .with({ path: P.union('/rpc', P.string.startsWith('/rpc/')), method: 'POST' }, () => rpc.http.handle(request, {
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
  const host = request.headers.get('host');

  return match(origin)
    .with(null, () => true)
    .otherwise((value) => {
      const url = URL.parse(value);

      return env.OPENBOTS_ALLOWED_ORIGINS.includes(url?.origin ?? value)
        || (url !== null && url.host === URL.parse(`http://${host}`)?.host);
    });
}
