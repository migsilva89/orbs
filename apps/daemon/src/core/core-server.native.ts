import { env } from '@openbots/env/server';
import { log } from '@openbots/logger/server';
import { onError } from '@orpc/server';
import { RequestHeadersPlugin } from '@orpc/server/plugins';
import { RPCHandler } from '@orpc/server/websocket';
import { match, P } from 'ts-pattern';
import { coreHandler, router } from '@openbots/server/server';
import type { makeServices } from '@openbots/server/server';

export function coreServerNative(services: Awaited<ReturnType<typeof makeServices>>) {
  const rpc = new RPCHandler(router, {
    plugins: [new RequestHeadersPlugin()],
    interceptors: [onError((error) => {
      log.error({
        tag: 'rpc',
        message: 'Request failed',
        error,
      });
    })],
  });

  return Bun.serve({
    hostname: env.OPENBOTS_HOST,
    port: env.OPENBOTS_PORT,
    maxRequestBodySize: 16 * 1024,
    fetch(request, server) {
      const url = new URL(request.url);

      const origin = request.headers.get('origin');

      return match({ path: url.pathname, origin })
        .with({ path: '/rpc', origin: P.union(null, url.origin) }, () => {
          return match(server.upgrade(request, { data: undefined }))
            .with(true, () => undefined)
            .with(false, () => new Response(null, { status: 426 }))
            .exhaustive();
        })
        .with({ path: '/rpc' }, () => new Response(null, { status: 403 }))
        .otherwise(() => coreHandler(request));
    },
    websocket: {
      maxPayloadLength: 1024 * 1024,
      backpressureLimit: 64 * 1024,
      closeOnBackpressureLimit: true,
      async message(socket, message) {
        await rpc.message(socket, message, {
          context: {
            auth: services.auth,
            runtime: services.runtime,
            bots: services.bots,
            conversation: services.conversation,
            tools: services.tools,
            skills: services.skills,
            instructions: services.instructions,
            plugins: services.plugins,
            mcp: services.mcp,
          },
        });
      },
      async close(socket) {
        await rpc.close(socket);
      },
    },
  });
}
