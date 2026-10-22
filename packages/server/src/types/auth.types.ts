import type { DatabaseService } from '../services/database/database.service';
import type { AuthPairInput } from '@repo/contracts/universal';

export interface AuthServiceParams {
  database: DatabaseService;
}

export interface AuthServiceDeps extends AuthServiceParams {
  revocations: Set<AuthRevocationListener>;
}

export type AuthRevocationListener = (deviceId: string) => void;

export interface AuthGrantParams {
  issuedBy: string | null;
}
export type AuthPairParams = AuthGrantParams & AuthPairInput;
export type AuthBootstrapParams = AuthPairInput & {
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
