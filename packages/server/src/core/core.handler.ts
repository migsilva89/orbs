import { errorStatusMap, isAppError } from '@openbots/errors/universal';
import { log } from '@openbots/logger/server';
import type { AuthService } from '../services/auth/auth.service';

export async function coreHandler(auth: AuthService, request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (request.method === 'GET' && url.pathname === '/health') {
    return Response.json({ status: 'ok' });
  }

  try {
    const response = await auth.handler(request);
    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    const headers = { 'Cache-Control': 'no-store' };

    if (error instanceof SyntaxError) {
      return Response.json({ code: 'VALIDATION_ERROR' }, { status: 400, headers });
    }

    if (isAppError(error)) {
      return Response.json({ code: error.code }, { status: errorStatusMap[error.code] ?? 500, headers });
    }

    log.error({
      tag: 'http',
      message: 'Request failed',
      error,
    });

    return Response.json({ code: 'INTERNAL_ERROR' }, { status: 500, headers });
  }
}
