import { authActionGrant } from './auth-action.grant';
import { authActionRedeem } from './auth-action.redeem';
import { authActionRevoke } from './auth-action.revoke';
import { authQueryDevice } from './auth-query.device';
import { authQueryDevices } from './auth-query.devices';
import { authHandler } from './auth.handler';
import type * as AuthTypes from '../../types/auth.types';

export function makeAuthService(deps: AuthTypes.AuthServiceDeps) {
  return {
    handler: (request: Request) => authHandler(deps, request),
    actions: {
      grant: (params: AuthTypes.AuthGrantParams) => authActionGrant(deps, params),
      redeem: (params: AuthTypes.AuthRedeemParams) => authActionRedeem(deps, params),
      revoke: (params: AuthTypes.AuthRevokeParams) => authActionRevoke(deps, params),
    },
    queries: {
      device: (params: AuthTypes.AuthTokenParams) => authQueryDevice(deps, params),
      devices: () => authQueryDevices(deps),
    },
  };
}

export type AuthService = ReturnType<typeof makeAuthService>;
