import type { RpcSession } from './rpc.types';
import type { AuthPairEntry, ConnectionSaved, ServerAddress } from '@repo/contracts/universal';

export interface ConnectionAvatarParams {
  session: Pick<RpcSession, 'address'> | null | undefined;
  src: string;
}

export interface ConnectionAddressesParams {
  connection: ConnectionSaved;
  addresses: ServerAddress[];
}

export interface ConnectionFileParams {
  botId: string;
  attachmentId: string;
}

export interface ConnectionPairParams {
  entry: AuthPairEntry;
  address: ServerAddress | null;
  name: string;
}
