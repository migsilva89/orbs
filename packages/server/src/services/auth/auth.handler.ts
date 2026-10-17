import { Errors } from '@openbots/errors/universal';
import { authDeviceId, authRedeem, authToken } from '../../types/auth.types';
import { authActionGrant } from './auth-action.grant';
import { authActionRedeem } from './auth-action.redeem';
import { authActionRevoke } from './auth-action.revoke';
import { authQueryDevice } from './auth-query.device';
import { authQueryDevices } from './auth-query.devices';
import type { AuthServiceDeps } from '../../types/auth.types';

export async function authHandler(deps: AuthServiceDeps, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');

  if (origin !== null && origin !== url.origin) {
    throw new Errors.FORBIDDEN();
  }

  if (request.method === 'POST' && url.pathname === '/pairing/redeem') {
    const params = authRedeem.safeParse(await request.json());

    if (!params.success) {
      throw new Errors.VALIDATION_ERROR({ fields: {} });
    }

    return Response.json(await authActionRedeem(deps, params.data), { status: 201 });
  }

  const bearer = /^Bearer (.+)$/i.exec(request.headers.get('authorization') ?? '');
  const token = authToken.safeParse(bearer?.[1]);

  if (!token.success) {
    throw new Errors.UNAUTHORIZED();
  }

  const device = await authQueryDevice(deps, { token: token.data });

  if (request.method === 'POST' && url.pathname === '/pairing') {
    return Response.json(await authActionGrant(deps, { issuedBy: device.id }), { status: 201 });
  }

  if (request.method === 'GET' && url.pathname === '/devices') {
    return Response.json(await authQueryDevices(deps));
  }

  if (request.method === 'DELETE' && url.pathname.startsWith('/devices/')) {
    const id = authDeviceId.safeParse(url.pathname.slice('/devices/'.length));

    if (!id.success) {
      throw new Errors.VALIDATION_ERROR({ fields: {} });
    }

    await authActionRevoke(deps, { id: id.data });

    return new Response(null, { status: 204 });
  }

  return new Response(null, { status: 404 });
}
