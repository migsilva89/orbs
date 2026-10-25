import type { AuthPairEntry, ConnectionSaved } from '@repo/contracts/universal';

export type ConnectionInfo = Pick<ConnectionSaved, 'serverId' | 'deviceId' | 'addresses'>;

export interface ConnectionPairParams {
  entry: AuthPairEntry;
  name: string;
}

export interface ConnectionTargetResult {
  url: string | null;
  isMismatch: boolean;
}

export interface ConnectionVerifyParams {
  serverId: string | undefined;
}
