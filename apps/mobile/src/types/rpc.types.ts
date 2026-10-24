import type { QueryNotifyParams, RpcContextValue } from '@repo/client/react';
import type { ConnectionSaved, ServerAddress } from '@repo/contracts/universal';
import type { QueryClient } from '@tanstack/react-query';

export interface RpcClientParams {
  connection: ConnectionSaved;
  notify: (params: QueryNotifyParams) => void;
  onUnauthorized: () => void;
}

export interface RpcSession extends RpcContextValue {
  connection: ConnectionSaved;
  queryClient: QueryClient;
  address: () => ServerAddress;
  reachability: {
    isReachable: () => boolean;
    subscribe: (listener: () => void) => () => void;
  };
  pause: () => void;
  resume: () => void;
}
