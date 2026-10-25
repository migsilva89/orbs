import { createRouterUtils } from '@orpc/tanstack-query';
import { connectionRpcUrl, connectionSocketUrl, makeClient, makeHttpClient } from '@repo/client/client';
import { Errors } from '@repo/errors/universal';
import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequest, getRequestHeader } from '@tanstack/react-start/server';
import { connectionRead, connectionVerify } from '@/services/connection/connection.client';
import { CONNECTION } from '@/services/connection/connection.constants';
import { connectionParse, connectionTarget } from '@/services/connection/connection.utils';

export const rpcClient = createIsomorphicFn()
  .server(() => makeHttpClient(async () => {
    const connection = await connectionRead();
    const request = getRequest();
    const target = await connectionTarget(getRequestHeader('cookie') ?? '');

    if (target.isMismatch) {
      throw new Errors.SERVER_MISMATCH();
    }

    if (!target.url) {
      throw new Errors.SERVER_UNREACHABLE();
    }

    return {
      url: connectionRpcUrl({ url: target.url }),
      serverId: connection?.serverId,
      token: () => connection?.token,
      fetch: (url, init) => fetch(url, {
        ...init,
        signal: init.signal ? AbortSignal.any([request.signal, init.signal]) : request.signal,
      }),
    };
  }))
  .client(() => {
    const connection = connectionParse(document.cookie);

    return makeClient({
      serverId: connection?.serverId,
      url: CONNECTION.rpcPath,
      token: () => connection?.token,
      connect: async () => {
        await connectionVerify({ serverId: connection?.serverId });

        return new WebSocket(connectionSocketUrl({ url: location.origin }));
      },
    });
  })();

export const rpc = createRouterUtils(rpcClient);
