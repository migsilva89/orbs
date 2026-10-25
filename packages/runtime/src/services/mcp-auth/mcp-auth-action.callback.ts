import { Errors } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpAuthCallbackExchange } from './mcp-auth-callback.utils';
import { mcpAuthAbort, mcpAuthBumpSave, mcpAuthPrune } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

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

      const status = await mcpAuthCallbackExchange(deps, url, session, String(callbackUrl))
        .then(() => 'connected' as const, () => 'failed' as const);

      match({ status, isOpen: deps.pending.get(url) === session && session.isCompleting !== true })
        .with({ status: 'failed', isOpen: true }, () => {
          mcpAuthBumpSave(deps, url);
          mcpAuthAbort(deps, url);
        })
        .otherwise(() => undefined);

      return { botId: session.botId, returnUrl: session.returnUrl, status };
    });
}
