import { renderSVG } from 'uqr';
import { authActionGrant } from './auth-action.grant';
import type { AuthPairParams, AuthServiceDeps } from '../../types/auth.types';

export async function authActionPair(deps: AuthServiceDeps, params: AuthPairParams) {
  const grant = await authActionGrant(deps, { issuedBy: params.issuedBy });

  const payload = JSON.stringify({
    version: 1,
    serverUrl: params.serverUrl,
    token: grant.token,
    expiresAt: grant.expiresAt,
  });

  const svg = renderSVG(payload, { ecc: 'M', border: 4 });

  return { ...grant, qr: { payload, svg } };
}
