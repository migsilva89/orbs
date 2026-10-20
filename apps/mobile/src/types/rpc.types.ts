import type { rpcClientCreate } from '@/services/rpc/rpc.client';
import type { ConnectionSaved } from '@openbots/contracts/universal';

export interface RpcClientParams {
  connection: ConnectionSaved;
  onUnauthorized: () => void;
}

export type RpcSession = ReturnType<typeof rpcClientCreate>;
