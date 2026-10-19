import { renderSVG } from 'uqr';
import { authActionGrant } from './auth-action.grant';
import type { AuthPairParams, AuthServiceDeps } from '../../types/auth.types';
import type { AuthPairPayload } from '@openbots/contracts/universal';

export async function authActionPair(deps: AuthServiceDeps, params: AuthPairParams) {
  const grant = await authActionGrant(deps, { issuedBy: params.issuedBy });

  const payload = btoa(JSON.stringify({
    version: 1,
    serverUrl: params.serverUrl,
    token: grant.token,
    expiresAt: grant.expiresAt,
  } satisfies AuthPairPayload)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');

  const svg = renderSVG(payload, { ecc: 'M', border: 4 });

  return { ...grant, qr: { payload, svg } };
}
