import { OpenAPIHandler } from '@orpc/openapi/fetch';
import { onError } from '@orpc/server';
import { RPCHandler as FetchRPCHandler } from '@orpc/server/fetch';
import { CORSPlugin, RequestHeadersPlugin } from '@orpc/server/plugins';
import { RPCHandler as WebsocketRPCHandler } from '@orpc/server/websocket';
import { env } from '@repo/env/server';
import { errorStatusMap, isAppError } from '@repo/errors/universal';
import { log } from '@repo/logger/server';
import { router } from '@repo/server/server';
import type { CoreRpcNativeParams } from '../types/core.types';
import type { RPCHandlerOptions } from '@orpc/server/fetch';
import type { makeServices } from '@repo/server/server';

export function coreRpcNative(
  services: Awaited<ReturnType<typeof makeServices>>,
  { isLocal = false }: CoreRpcNativeParams = {},
) {
  const plugins = [new RequestHeadersPlugin()];

  const interceptors: RPCHandlerOptions<object>['interceptors'] = [onError((error, { path }) => {
    const fields = { tag: 'rpc', message: 'Request failed', path: path.join('.') };

    if (isAppError(error) && !error.reportable) {
      log.warn({
        ...fields,
        code: error.code,
        reason: error.internal,
        data: error.data,
      });
      return;
    }

    log.error({ ...fields, error });
  })];

  return {
    context: {
      server: services.server,
      limits: services.limits,
      providers: services.providers,
      mcpAuth: services.mcpAuth,
      routines: services.routines,
      todos: services.todos,
      auth: services.auth,
      credentials: services.credentials,
      secrets: services.secrets,
      isLocal,
      peerAddress: null,
      runtime: services.runtime,
      bots: services.bots,
      sidebarSections: services.sidebarSections,
      conversation: services.conversation,
      tools: services.tools,
      skills: services.skills,
      instructions: services.instructions,
      plugins: services.plugins,
      mcp: services.mcp,
      attachments: services.attachments,
      avatars: services.avatars,
      artifacts: services.artifacts,
      notifications: services.notifications,
    },
    http: new FetchRPCHandler(router, {
      plugins: [...plugins, new CORSPlugin({ origin: env.DAEMON_ALLOWED_ORIGINS })],
      interceptors,
      errorStatusMap,
    }),
    files: new OpenAPIHandler({ download: router.attachments.download }, {
      plugins: [...plugins, new CORSPlugin({ origin: env.DAEMON_ALLOWED_ORIGINS })],
      interceptors,
      errorStatusMap,
    }),
    websocket: new WebsocketRPCHandler(router, {
      plugins,
      interceptors,
      errorStatusMap,
    }),
  };
}
