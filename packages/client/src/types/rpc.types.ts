import type { Client } from './client.types';
import type { createRouterUtils } from '@orpc/tanstack-query';

/** The daemon client and its TanStack Query utilities that shared hooks read from `rpcContext`. */
export interface RpcContextValue {
  client: Client;
  rpc: ReturnType<typeof createRouterUtils<Client>>;
}
