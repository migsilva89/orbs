import type { AuthPairPayload, ConnectionSaved } from '@repo/contracts/universal';

export type ConnectionInfo = Pick<ConnectionSaved, 'serverUrl' | 'serverId' | 'deviceId'>;

export interface ConnectionPairParams {
  payload: AuthPairPayload;
  name: string;
}

export interface ConnectionUrlParams {
  serverUrl: string;
}
