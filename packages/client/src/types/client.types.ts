import type { contract } from '@openbots/contracts/universal';
import type { RouterContractClient } from '@orpc/contract';

export type Client = RouterContractClient<typeof contract>;

export interface ClientOptions {
  connect: () => WebSocket;
  token?: () => string | undefined | Promise<string | undefined>;
}
