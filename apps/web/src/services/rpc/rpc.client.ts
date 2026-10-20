import { makeClient, makeHttpClient } from '@openbots/client/client';
import { env } from '@openbots/env/server';
import { createRouterUtils } from '@orpc/tanstack-query';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { connectionMigrate, connectionRead, connectionRpcUrl, connectionSocketUrl } from '@/services/connection/connection.client';
import { CONNECTION } from '@/services/connection/connection.constants';
import { connectionParse } from '@/services/connection/connection.utils';

export const rpcClient = createIsomorphicFn()
  .server(() => makeHttpClient(async () => {
    const connection = await connectionRead();
    const request = getRequest();

    return {
      url: connectionRpcUrl({ serverUrl: env.OPENBOTS_DAEMON_URL }),
      serverId: connection?.serverId,
      token: () => connection?.token,
      fetch: (url, init) => fetch(url, {
        ...init,
        signal: init.signal ? AbortSignal.any([request.signal, init.signal]) : request.signal,
      }),
    };
  }))
  .client(() => {
    connectionMigrate();
    const connection = connectionParse(document.cookie);

    return makeClient({
      serverId: connection?.serverId,
      url: CONNECTION.rpcPath,
      token: () => connection?.token,
      connect: () => new WebSocket(connectionSocketUrl({ serverUrl: location.origin })),
    });
  })();

export const rpc = createRouterUtils(rpcClient);
