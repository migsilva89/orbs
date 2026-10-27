import type { DatabaseService } from '../services/database/database.service';
import type { ServerAddress } from '@repo/contracts/universal';

export interface AuthServiceParams {
  database: DatabaseService;
  appScheme: string;
}

export interface AuthServiceDeps extends AuthServiceParams {
  revocations: Set<AuthRevocationListener>;
}

export type AuthRevocationListener = (deviceId: string) => void;

export interface AuthGrantParams {
  issuedBy: string | null;
}
export interface AuthGrant {
  pin: string;
  expiresAt: number;
}
export interface AuthPairTarget {
  serverId: string;
  addresses: ServerAddress[];
}
export type AuthPairParams = AuthGrantParams & AuthPairTarget;
export type AuthBootstrapParams = AuthPairTarget & {
  isLocal: boolean;
};
export interface AuthTokenParams {
  token: string;
}
export interface AuthAuthenticateParams {
  authorization: string | null | undefined;
}
export interface AuthRevokeParams {
  id: string;
}
