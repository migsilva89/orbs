import type { ConnectionSaved } from '@openbots/contracts/universal';

export interface RpcClientParams {
  connection: ConnectionSaved;
  onUnauthorized: () => void;
}
