import { authorizeMcp } from '@earendil-works/pi-mcp/oauth';
import { Errors, isAppError } from '@repo/errors/universal';
import { match, P } from 'ts-pattern';
import {
  mcpAuthBind,
  mcpAuthDropSession,
  mcpAuthInvalid,
  mcpAuthNetworkSignal,
  mcpAuthParseCallback,
  mcpAuthPrune,
  mcpAuthServerUrl,
} from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthActionComplete(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthCompleteParams,
): Promise<McpAuthTypes.McpAuthCompleteResult> {
  const url = mcpAuthServerUrl(params.serverUrl);
  mcpAuthPrune(deps);

  const pending = deps.pending.get(url);

  return await match(pending)
    .with(P.nullish, () => {
      throw new Errors.NOT_FOUND({ resource: 'mcp-auth' });
    })
    .with({ deviceId: P.not(params.deviceId) }, () => {
      throw new Errors.FORBIDDEN();
    })
    .when((session) => session.isCompleting === true, () => {
      throw new Errors.CONFLICT();
    })
    .when((session) => session.state === undefined, () => {
      throw new Errors.CONFLICT();
    })
    .otherwise(async (session) => {
      const callback = mcpAuthParseCallback(session.redirectUrl, session.state ?? '', params.callbackUrl);

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
    });
}
