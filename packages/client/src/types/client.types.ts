import type { contract } from '@openbots/contracts/universal';
import type { ClientContext } from '@orpc/client';
import type { RPCLinkOptions } from '@orpc/client/fetch';
import type { RouterContractClient } from '@orpc/contract';

export type Client = RouterContractClient<typeof contract>;

export interface ClientOptions {
  serverId?: string;
  connect: () => WebSocket;
  token?: () => string | undefined | Promise<string | undefined>;
  url?: string;
}

export interface HttpClientOptions extends Pick<ClientOptions, 'serverId' | 'token'> {
  url: string;
  fetch?: RPCLinkOptions<ClientContext>['fetch'];
}
