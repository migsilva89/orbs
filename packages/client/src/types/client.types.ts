import type { ClientContext } from '@orpc/client';
import type { RPCLinkOptions } from '@orpc/client/fetch';
import type { RouterContractClient } from '@orpc/contract';
import type { contract } from '@repo/contracts/universal';

export type Client = RouterContractClient<typeof contract>;

export interface ClientOptions {
  serverId?: string;
  connect: () => WebSocket | Promise<WebSocket>;
  token?: () => string | undefined | Promise<string | undefined>;
  url?: string | (() => string);
}

export interface ClientHttpOptions extends Pick<ClientOptions, 'serverId' | 'token'> {
  url: string;
  fetch?: RPCLinkOptions<ClientContext>['fetch'];
}
