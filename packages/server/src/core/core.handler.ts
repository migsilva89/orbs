import { match } from 'ts-pattern';

export function coreHandler(request: Request): Response {
  const url = new URL(request.url);

  return match({ method: request.method, path: url.pathname })
    .with({ method: 'GET', path: '/health' }, () => Response.json({ status: 'ok', app: 'bots' }))
    .otherwise(() => new Response(null, { status: 404 }));
}
