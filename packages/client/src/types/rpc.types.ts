import type { Client } from './client.types';
import type { createRouterUtils } from '@orpc/tanstack-query';

export interface RpcContextValue {
  client: Client;
  rpc: ReturnType<typeof createRouterUtils<Client>>;
}
