import { makeClient } from '@openbots/client/client';
import { createRouterUtils } from '@orpc/tanstack-query';
import { connectionRead, connectionRpcUrl, connectionSocketUrl } from '@/services/connection/connection.client';

const connection = connectionRead();

export const rpcClient = makeClient({
  serverId: connection?.serverId,
  url: connection ? connectionRpcUrl(connection) : undefined,
  token: () => connection?.token,
  connect: () => new WebSocket(connectionSocketUrl({ serverUrl: connection?.serverUrl ?? location.origin })),
});

export const rpc = createRouterUtils(rpcClient);
