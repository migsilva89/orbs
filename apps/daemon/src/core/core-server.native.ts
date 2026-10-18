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
      const origin = request.headers.get('origin');

      return match({
        path: url.pathname,
        origin,
        method: request.method,
      })
        .with({ path: P.union('/rpc', P.string.startsWith('/rpc/')), origin: P.not(P.union(null, url.origin)) }, () => (
          new Response(null, { status: 403 })
        ))
        .with({ path: P.union('/rpc', P.string.startsWith('/rpc/')), method: 'POST' }, () => rpc.http.handle(request, {
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
        .with({ path: '/rpc', method: 'GET' }, () => match(server.upgrade(request, { data: undefined }))
          .with(true, () => undefined)
          .with(false, () => new Response(null, { status: 426 }))
          .exhaustive())
        .otherwise(() => coreHandler(request));
    },
    websocket: {
      maxPayloadLength: 1024 * 1024,
      backpressureLimit: 64 * 1024,
      closeOnBackpressureLimit: true,
      async message(socket, message) {
        await rpc.websocket.message(socket, message, { context: rpc.context });
      },
      async close(socket) {
        await rpc.websocket.close(socket);
      },
    },
  });
}
