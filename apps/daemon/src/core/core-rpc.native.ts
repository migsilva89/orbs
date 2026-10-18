import { log } from '@openbots/logger/server';
import { onError } from '@orpc/server';
import { RPCHandler as FetchRPCHandler } from '@orpc/server/fetch';
import { RequestHeadersPlugin } from '@orpc/server/plugins';
import { RPCHandler as WebsocketRPCHandler } from '@orpc/server/websocket';
import { router } from '@openbots/server/server';
import type { CoreRpcNativeParams } from '../types/core.types';
import type { makeServices } from '@openbots/server/server';
import type { RPCHandlerOptions } from '@orpc/server/fetch';

export function coreRpcNative(
  services: Awaited<ReturnType<typeof makeServices>>,
  { isLocal = false }: CoreRpcNativeParams = {},
) {
  const plugins = [new RequestHeadersPlugin()];

  const interceptors: RPCHandlerOptions<object>['interceptors'] = [onError((error) => {
    log.error({
      tag: 'rpc',
      message: 'Request failed',
      error,
    });
  })];

  return {
    context: {
      server: services.server,
      routines: services.routines,
      auth: services.auth,
      credentials: services.credentials,
      isLocal,
      runtime: services.runtime,
      bots: services.bots,
      conversation: services.conversation,
      tools: services.tools,
      skills: services.skills,
      instructions: services.instructions,
      plugins: services.plugins,
      mcp: services.mcp,
      attachments: services.attachments,
      artifacts: services.artifacts,
    },
    http: new FetchRPCHandler(router, { plugins, interceptors }),
    websocket: new WebsocketRPCHandler(router, { plugins, interceptors }),
  };
}
