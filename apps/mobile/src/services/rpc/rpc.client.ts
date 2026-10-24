import { ORPCError } from '@orpc/client';
import { createRouterUtils } from '@orpc/tanstack-query';
import { connectionAddressPick, connectionRpcUrl, connectionSocketUrl, makeClient } from '@repo/client/client';
import { queryMutationCache } from '@repo/client/react';
import { Errors } from '@repo/errors/universal';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { match } from 'ts-pattern';
import { connectionAddressesLearn } from '@/services/connection/connection.client';
import type { RpcClientParams, RpcSession } from '@/types/rpc.types';

export function rpcClientCreate({ connection, notify, onUnauthorized }: RpcClientParams): RpcSession {
  let socket: WebSocket | undefined;
  let isActive = AppState.currentState === 'active';
  let isReachable = true;
  let address = connection.addresses[0];
  const reachabilityListeners = new Set<() => void>();

  const rpcReachableSet = (next: boolean) => {
    if (next === isReachable) {
      return;
    }

    isReachable = next;
    reachabilityListeners.forEach((listener) => listener());
  };

  const client = makeClient({
    serverId: connection.serverId,
    url: () => connectionRpcUrl(address),
    token: () => connection.token,
    connect: () => {
      return match(isActive)
        .with(true, async () => {
          const { address: picked } = await connectionAddressPick(connection);

          if (!picked) {
            rpcReachableSet(false);
            throw new Errors.CONFLICT({ internal: 'No server address answered' });
          }

          address = picked;
          socket = new WebSocket(connectionSocketUrl(picked));
          socket.addEventListener('open', () => {
            rpcReachableSet(true);
            void client.server.info().then((info) => connectionAddressesLearn({ connection, addresses: info.addresses }), () => undefined);
          });
          socket.addEventListener('close', () => rpcReachableSet(!isActive && isReachable));

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
    mutationCache: queryMutationCache({ notify, onError: rpcOnError }),
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
    address: () => address,
    reachability: {
      isReachable: () => isReachable,
      subscribe: (listener) => {
        reachabilityListeners.add(listener);

        return () => reachabilityListeners.delete(listener);
      },
    },
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
