import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpAuthAbort, mcpAuthBumpSave, mcpAuthExchange, mcpAuthPrune } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

/**
 * Finishes a login from the browser that landed on the redirect URL. That browser is often not a paired device
 * (the system browser on desktop, a login sheet on iOS), so the one-time `state` of a login a device started is the
 * proof; PKCE still protects the code exchange. A refused or failed exchange is reported rather than thrown, so the
 * callback page can still send the browser back to the app.
 */
export async function mcpAuthActionCallback(
  deps: McpAuthTypes.McpAuthServiceState,
  { search }: McpAuthTypes.McpAuthCallbackParams,
): Promise<McpAuthTypes.McpAuthCallbackResult> {
  mcpAuthPrune(deps);

  const state = new URLSearchParams(search).get('state');
  const pending = [...deps.pending.entries()].find(([, session]) => state !== null && session.state === state);

  return await match(pending)
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'mcp-auth' });
    })
    .otherwise(async ([url, session]) => {
      const callbackUrl = new URL(session.redirectUrl);
      callbackUrl.search = search;

      const status = await mcpAuthExchange(deps, url, session, String(callbackUrl))
        .then(() => 'connected' as const, () => 'failed' as const);

      // A refused callback cannot be retried, so end the login unless another request is still exchanging its code.
      match({ status, isOpen: deps.pending.get(url) === session && session.isCompleting !== true })
        .with({ status: 'failed', isOpen: true }, () => {
          mcpAuthBumpSave(deps, url);
          mcpAuthAbort(deps, url);
        })
        .otherwise(() => undefined);

      return { botId: session.botId, returnUrl: session.returnUrl, status };
    });
}
