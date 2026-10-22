import type { QueryNotifyParams, RpcContextValue } from '@repo/client/react';
import type { ConnectionSaved } from '@repo/contracts/universal';
import type { QueryClient } from '@tanstack/react-query';

export interface RpcClientParams {
  connection: ConnectionSaved;
  notify: (params: QueryNotifyParams) => void;
  onUnauthorized: () => void;
}

export interface RpcSession extends RpcContextValue {
  connection: ConnectionSaved;
  queryClient: QueryClient;
  pause: () => void;
  resume: () => void;
}
