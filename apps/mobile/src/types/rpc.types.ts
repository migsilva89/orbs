import type { Client } from '@openbots/client/client';
import type { ConnectionSaved } from '@openbots/contracts/universal';
import type { createRouterUtils } from '@orpc/tanstack-query';
import type { QueryClient } from '@tanstack/react-query';

export interface RpcClientParams {
  connection: ConnectionSaved;
  onUnauthorized: () => void;
}

export interface RpcSession {
  connection: ConnectionSaved;
  client: Client;
  rpc: ReturnType<typeof createRouterUtils<Client>>;
  queryClient: QueryClient;
  pause: () => void;
  resume: () => void;
}
