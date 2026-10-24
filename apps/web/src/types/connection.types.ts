import type { AuthPairPayload, ConnectionSaved } from '@repo/contracts/universal';

export type ConnectionInfo = Pick<ConnectionSaved, 'serverId' | 'deviceId' | 'addresses'>;

export interface ConnectionPairParams {
  payload: AuthPairPayload;
  name: string;
}

export interface ConnectionTargetResult {
  url: string | null;
  isMismatch: boolean;
}
