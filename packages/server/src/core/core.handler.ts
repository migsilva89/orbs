import { isAppError } from '@repo/errors/universal';
import * as m from '@repo/i18n/messages';
import { match, P } from 'ts-pattern';
import type { CoreHandlerDeps } from '../types/core.types';

export function coreHandler(request: Request, deps: CoreHandlerDeps): Response | Promise<Response> {
  const url = new URL(request.url);

  return match({ method: request.method, path: url.pathname })
    .with({ method: 'GET', path: '/health' }, () => Response.json({ status: 'ok', app: 'bots' }))
    .with({ method: 'GET', path: '/mcp/callback' }, () => coreMcpCallback(deps, url))
    .otherwise(() => new Response(null, { status: 404 }));
}

async function coreMcpCallback({ mcpAuth }: CoreHandlerDeps, url: URL): Promise<Response> {
  try {
    const { returnUrl, status } = await mcpAuth.actions.callback({ search: url.search });

    return match({ returnUrl, status })
      .with({ returnUrl: P.string }, (result) => coreRedirect(result.returnUrl, result.status))
      .with({ status: 'connected' }, () => corePage(m.settings_mcp_callback_connected_title(), m.settings_mcp_callback_connected_body()))
      .otherwise(() => corePage(m.settings_mcp_callback_failed_title(), m.settings_mcp_callback_failed_body(), 400));
  } catch (error) {
    const expired = isAppError(error) && error.code === 'NOT_FOUND';

    return corePage(
      m.settings_mcp_callback_failed_title(),
      expired ? m.settings_mcp_callback_expired_body() : m.settings_mcp_callback_failed_body(),
      expired ? 410 : 400,
    );
  }
}

function coreRedirect(link: string, status: string): Response {
  const target = new URL(link);
  target.searchParams.set('status', status);

  return new Response(null, { status: 302, headers: { 'Location': String(target), 'Cache-Control': 'no-store' } });
}

function corePage(title: string, body: string, status = 200): Response {
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${coreEscape(title)}</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;font:15px -apple-system,system-ui,sans-serif;background:#fafafa;color:#18181b}main{max-width:22rem;padding:2rem;text-align:center}h1{font-size:1.15rem;margin:0 0 .5rem}p{margin:0;color:#71717a}@media(prefers-color-scheme:dark){body{background:#09090b;color:#fafafa}p{color:#a1a1aa}}</style>
</head><body><main><h1>${coreEscape(title)}</h1><p>${coreEscape(body)}</p></main></body></html>`;

  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'",
      'Referrer-Policy': 'no-referrer',
    },
  });
}

function coreEscape(value: string): string {
  return value.replace(/[&<>"']/gu, (char) => `&#${char.charCodeAt(0)};`);
}
