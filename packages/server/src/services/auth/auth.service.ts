import { authActionGrant } from './auth-action.grant';
import { authActionPair } from './auth-action.pair';
import { authActionRedeem } from './auth-action.redeem';
import { authActionRevoke } from './auth-action.revoke';
import { authQueryAuthenticate } from './auth-query.authenticate';
import { authQueryDevice } from './auth-query.device';
import { authQueryDevices } from './auth-query.devices';
import { authQueryGrant } from './auth-query.grant';
import type * as AuthTypes from '../../types/auth.types';
import type { AuthRedeemInput } from '@openbots/contracts/universal';

export function makeAuthService({ database }: AuthTypes.AuthServiceParams) {
  const revocations = new Set<AuthTypes.AuthRevocationListener>();
  const deps = { database, revocations };

  return {
    onRevoke: (listener: AuthTypes.AuthRevocationListener) => {
      revocations.add(listener);
      return () => {
        revocations.delete(listener);
      };
    },
    actions: {
      pair: (params: AuthTypes.AuthPairParams) => authActionPair(deps, params),
      grant: (params: AuthTypes.AuthGrantParams) => authActionGrant(deps, params),
      redeem: (params: AuthRedeemInput) => authActionRedeem(deps, params),
      revoke: (params: AuthTypes.AuthRevokeParams) => authActionRevoke(deps, params),
    },
    queries: {
      authenticate: (params: AuthTypes.AuthAuthenticateParams) => authQueryAuthenticate(deps, params),
      grant: (params: AuthTypes.AuthTokenParams) => authQueryGrant(deps, params),
      device: (params: AuthTypes.AuthTokenParams) => authQueryDevice(deps, params),
      devices: () => authQueryDevices(deps),
    },
  };
}

export type AuthService = ReturnType<typeof makeAuthService>;
