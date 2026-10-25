import { createRouterUtils } from '@orpc/tanstack-query';
import { connectionAddressPick, connectionLostReason, connectionRpcUrl, connectionSocketUrl, makeClient } from '@repo/client/client';
import { queryMutationCache } from '@repo/client/react';
import { Errors } from '@repo/errors/universal';
import { QueryCache, QueryClient } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { match, P } from 'ts-pattern';
import { connectionAddressesLearn } from '@/services/connection/connection.client';
import type { RpcClientParams, RpcSession } from '@/types/rpc.types';

export function rpcClientCreate({ connection, notify, onDisconnected }: RpcClientParams): RpcSession {
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
          const { address: picked, isMismatch } = await connectionAddressPick(connection);

          if (!picked) {
            rpcReachableSet(false);
            match(isMismatch)
              .with(true, () => onDisconnected('replaced'))
              .with(false, () => undefined)
              .exhaustive();
            throw new Errors.SERVER_UNREACHABLE();
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
    match(connectionLostReason(error))
      .with(P.nonNullable, onDisconnected)
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
