import { authorizeMcp } from '@earendil-works/pi-mcp/oauth';
import { Errors, isAppError } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpAuthBind, mcpAuthDropSession, mcpAuthInvalid, mcpAuthNetworkSignal } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

function mcpAuthCallbackSameRedirect(issued: string, callback: string): boolean {
  try {
    const expected = new URL(issued);
    const received = new URL(callback);

    return match({
      protocol: received.protocol === expected.protocol,
      host: received.host === expected.host,
      path: received.pathname === expected.pathname,
    })
      .with({
        protocol: true,
        host: true,
        path: true,
      }, () => true)
      .otherwise(() => false);
  } catch {
    return false;
  }
}

function mcpAuthCallbackParse(
  redirectUrl: string,
  state: string,
  callbackUrl: string,
): McpAuthTypes.McpAuthCallback {
  match(mcpAuthCallbackSameRedirect(redirectUrl, callbackUrl))
    .with(false, () => {
      throw mcpAuthInvalid('callbackUrl');
    })
    .with(true, () => undefined)
    .exhaustive();

  try {
    const callback = new URL(callbackUrl);
    const error = callback.searchParams.get('error');
    const code = callback.searchParams.get('code');
    const received = callback.searchParams.get('state');
    const iss = callback.searchParams.get('iss') ?? undefined;

    return match({
      error,
      code,
      received,
    })
      .with({ error: P.string }, () => {
        throw mcpAuthInvalid('callbackUrl');
      })
      .with({ received: P.not(state) }, () => {
        throw mcpAuthInvalid('callbackUrl');
      })
      .with({ code: P.union(P.nullish, '') }, () => {
        throw mcpAuthInvalid('callbackUrl');
      })
      .with({ code: P.string }, ({ code: authorizationCode }) => ({ code: authorizationCode, iss }))
      .exhaustive();
  } catch (error) {
    throw isAppError(error) ? error : mcpAuthInvalid('callbackUrl', error);
  }
}

export async function mcpAuthCallbackExchange(
  deps: McpAuthTypes.McpAuthServiceState,
  url: string,
  session: McpAuthTypes.McpAuthPending,
  callbackUrl: string,
): Promise<McpAuthTypes.McpAuthCompleteResult> {
  match(session)
    .when((pending) => pending.isCompleting === true || pending.state === undefined, () => {
      throw new Errors.CONFLICT();
    })
    .otherwise(() => undefined);

  const callback = mcpAuthCallbackParse(session.redirectUrl, session.state ?? '', callbackUrl);

  session.isCompleting = true;

  const cached = mcpAuthBind(deps, url, session.redirectUrl);

  try {
    const result = await authorizeMcp(cached.oauth, {
      serverUrl: url,
      authorizationCode: callback.code,
      iss: callback.iss,
      signal: mcpAuthNetworkSignal(session.controller),
    });

    session.controller.signal.throwIfAborted();

    return match(result)
      .with('AUTHORIZED', () => {
        mcpAuthDropSession(deps, url, session);
        return { status: 'authorized' as const };
      })
      .with('REDIRECT', () => {
        throw mcpAuthInvalid('callbackUrl');
      })
      .exhaustive();
  } catch (error) {
    throw match(session.controller.signal.aborted)
      .with(true, () => new Errors.CONFLICT({ cause: error }))
      .with(false, () => (isAppError(error) ? error : mcpAuthInvalid('callbackUrl', error)))
      .exhaustive();
  } finally {
    match(deps.pending.get(url) === session)
      .with(true, () => {
        session.isCompleting = false;
      })
      .with(false, () => undefined)
      .exhaustive();
  }
}
