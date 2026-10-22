import { authorizeMcp } from '@earendil-works/pi-mcp/oauth';
import { Errors, isAppError } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { MCP_AUTH } from './mcp-auth.constants';
import {
  mcpAuthBind,
  mcpAuthDropSession,
  mcpAuthInvalid,
  mcpAuthNetworkSignal,
  mcpAuthPrune,
  mcpAuthRedirectUrl,
  mcpAuthResetLogin,
  mcpAuthRetryAfter,
  mcpAuthServerUrl,
} from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthActionStart(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthStartParams,
): Promise<McpAuthTypes.McpAuthStartResult> {
  const url = mcpAuthServerUrl(params.serverUrl);
  const redirect = mcpAuthRedirectUrl(params.redirectUrl);
  mcpAuthPrune(deps);

  match(deps.pending.get(url))
    .with(P.nonNullable, () => {
      throw new Errors.CONFLICT();
    })
    .with(undefined, () => undefined)
    .exhaustive();

  match(deps.pending.size >= MCP_AUTH.maxPending)
    .with(true, () => {
      throw new Errors.RATE_LIMITED({ retryAfter: mcpAuthRetryAfter(deps) });
    })
    .with(false, () => undefined)
    .exhaustive();

  const controller = new AbortController();

  const session: McpAuthTypes.McpAuthPending = {
    deviceId: params.deviceId,
    serverUrl: url,
    redirectUrl: redirect,
    controller,
    createdAt: Date.now(),
  };

  deps.pending.set(url, session);

  try {
    await mcpAuthResetLogin(deps, url, redirect);

    controller.signal.throwIfAborted();

    const cached = mcpAuthBind(deps, url, redirect);
    let authorizationUrl: URL | undefined;
    cached.onRedirect.current = (next) => {
      authorizationUrl = next;
      return undefined;
    };

    const result = await authorizeMcp(cached.oauth, { serverUrl: url, signal: mcpAuthNetworkSignal(controller) });
    controller.signal.throwIfAborted();

    return await match(result)
      .with('AUTHORIZED', async () => {
        mcpAuthDropSession(deps, url, session);
        return { status: 'authorized' as const };
      })
      .with('REDIRECT', async () => {
        const state = await cached.oauth.state();
        controller.signal.throwIfAborted();
        session.state = state;

        return match(authorizationUrl)
          .with(undefined, () => {
            mcpAuthDropSession(deps, url, session);
            throw mcpAuthInvalid('redirectUrl');
          })
          .otherwise((next) => ({
            status: 'redirect' as const,
            authorizationUrl: next.href,
            state,
          }));
      })
      .exhaustive();
  } catch (error) {
    mcpAuthDropSession(deps, url, session);

    throw match(controller.signal.aborted)
      .with(true, () => new Errors.CONFLICT({ cause: error }))
      .with(false, () => (isAppError(error) ? error : mcpAuthInvalid('serverUrl', error)))
      .exhaustive();
  }
}
