import type { AuthPairEntry } from '@repo/contracts/universal';

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
