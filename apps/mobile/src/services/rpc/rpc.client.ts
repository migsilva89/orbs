import { makeClient } from '@openbots/client/client';
import { Errors } from '@openbots/errors/universal';
import { ORPCError } from '@orpc/client';
import { createRouterUtils } from '@orpc/tanstack-query';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { match } from 'ts-pattern';
import { connectionRpcUrl, connectionSocketUrl } from '@/services/connection/connection.client';
import type { RpcClientParams, RpcSession } from '@/types/rpc.types';

export function rpcClientCreate({ connection, onUnauthorized }: RpcClientParams): RpcSession {
  let socket: WebSocket | undefined;
  let isActive = AppState.currentState === 'active';

  const client = makeClient({
    serverId: connection.serverId,
    url: connectionRpcUrl(connection),
    token: () => connection.token,
    connect: () => {
      return match(isActive)
        .with(true, () => {
          socket = new WebSocket(connectionSocketUrl(connection));
          return socket;
        })
        .with(false, () => {
          throw new Errors.CONFLICT({ internal: 'Connection is inactive' });
        })
        .exhaustive();
    },
  });

  const rpcOnError = (error: Error) => {
    match(error)
      .when((value) => value instanceof ORPCError && value.code === 'UNAUTHORIZED', onUnauthorized)
      .otherwise(() => undefined);
  };

  const queryClient = new QueryClient({
    queryCache: new QueryCache({ onError: rpcOnError }),
    mutationCache: new MutationCache({ onError: rpcOnError }),
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: { retry: false },
    },
  });

  return {
    connection,
    client,
    rpc: createRouterUtils(client),
    queryClient,
    pause() {
      isActive = false;
      void queryClient.cancelQueries();
      socket?.close();
      socket = undefined;
    },
    resume() {
      isActive = true;
      void queryClient.invalidateQueries();
    },
  };
}
