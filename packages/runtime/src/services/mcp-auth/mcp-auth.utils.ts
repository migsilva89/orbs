import { adaptOAuthProvider, McpOAuthAuthorizationRequiredError, McpOAuthProvider } from '@earendil-works/pi-mcp/oauth';
import { Errors, isAppError } from '@openbots/errors/universal';
import { createHash } from 'node:crypto';
import { match, P } from 'ts-pattern';
import { mcpAuthStored } from '../../types/mcp-auth.types';
import { MCP_AUTH } from './mcp-auth.constants';
import type * as McpAuthTypes from '../../types/mcp-auth.types';
import type { AuthProvider } from '@earendil-works/pi-mcp';
import type { McpOAuthStateStore } from '@earendil-works/pi-mcp/oauth';

export function mcpAuthServerUrl(value: string): string {
  try {
    const url = new URL(value);

    return match(url.protocol)
      .with('http:', 'https:', () => String(url))
      .otherwise(() => {
        throw mcpAuthInvalid('serverUrl');
      });
  } catch (error) {
    throw isAppError(error) ? error : mcpAuthInvalid('serverUrl');
  }
}

export function mcpAuthRedirectUrl(value: string): string {
  try {
    return String(new URL(value));
  } catch {
    throw mcpAuthInvalid('redirectUrl');
  }
}

export function mcpAuthCredentialKey(serverUrl: string): string {
  return `${MCP_AUTH.credentialPrefix}${createHash('sha256').update(serverUrl).digest('hex')}`;
}

export function mcpAuthEpoch(deps: McpAuthTypes.McpAuthServiceState, serverUrl: string): number {
  return deps.epochs.get(serverUrl) ?? 0;
}

export function mcpAuthBump(deps: McpAuthTypes.McpAuthServiceState, serverUrl: string): void {
  deps.epochs.set(serverUrl, mcpAuthEpoch(deps, serverUrl) + 1);
  mcpAuthBumpSave(deps, serverUrl);
  deps.providers.delete(serverUrl);
}

function mcpAuthSaveEpoch(deps: McpAuthTypes.McpAuthServiceState, serverUrl: string): number {
  return deps.saveEpochs.get(serverUrl) ?? 0;
}

export function mcpAuthBumpSave(deps: McpAuthTypes.McpAuthServiceState, serverUrl: string): void {
  deps.saveEpochs.set(serverUrl, mcpAuthSaveEpoch(deps, serverUrl) + 1);
}

export function mcpAuthDropSession(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
  session: McpAuthTypes.McpAuthPending,
): void {
  match(deps.pending.get(serverUrl) === session)
    .with(true, () => {
      deps.pending.delete(serverUrl);
    })
    .with(false, () => undefined)
    .exhaustive();
}

export async function mcpAuthResetLogin(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
  redirectUrl: string,
) {
  await mcpAuthEnqueue(deps, serverUrl, async () => {
    const record = await mcpAuthRecordLoad(deps, serverUrl);

    await match(record)
      .with(undefined, async () => undefined)
      .with(P.nonNullable, async (stored) => {
        const next: Record<string, unknown> = { ...stored };
        delete next.oauthState;
        delete next.codeVerifier;

        await match(stored.redirectUrl === redirectUrl)
          .with(true, async () => undefined)
          .with(false, async () => {
            delete next.clientInformation;
          })
          .exhaustive();

        await deps.credentials.actions.set({
          key: mcpAuthCredentialKey(serverUrl),
          value: JSON.stringify(next),
        });
      })
      .exhaustive();
  });
}

export function mcpAuthInvalid(field: string, cause?: unknown) {
  return new Errors.VALIDATION_ERROR({ fields: { [field]: { message: 'validation_oauth' } }, cause });
}

export function mcpAuthNetworkSignal(controller: AbortController): AbortSignal {
  return AbortSignal.any([controller.signal, AbortSignal.timeout(MCP_AUTH.requestTimeoutMs)]);
}

async function mcpAuthRecordLoad(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
): Promise<McpAuthTypes.McpAuthRecord | undefined> {
  const value = await deps.credentials.queries.get({ key: mcpAuthCredentialKey(serverUrl) });

  return match(value)
    .with(P.string, (stored) => mcpAuthRecordParse(stored, serverUrl))
    .with(null, () => undefined)
    .exhaustive();
}

export function mcpAuthRecordRead(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
): Promise<McpAuthTypes.McpAuthRecord | undefined> {
  return mcpAuthEnqueue(deps, serverUrl, () => mcpAuthRecordLoad(deps, serverUrl));
}

function mcpAuthRecordParse(stored: string, serverUrl: string): McpAuthTypes.McpAuthRecord | undefined {
  try {
    const parsed = mcpAuthStored.safeParse(JSON.parse(stored));

    return match(parsed)
      .with({ success: false }, () => undefined)
      .with({ success: true }, ({ data }) => match(mcpAuthStoredUrl(data.serverUrl))
        .with(serverUrl, () => data)
        .otherwise(() => undefined))
      .exhaustive();
  } catch {
    return undefined;
  }
}

function mcpAuthStoredUrl(value: string): string | undefined {
  try {
    const url = new URL(value);

    return match(url.protocol)
      .with('http:', 'https:', () => String(url))
      .otherwise(() => undefined);
  } catch {
    return undefined;
  }
}

function mcpAuthStateStore(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
  bind: McpAuthTypes.McpAuthStoreBind,
): McpOAuthStateStore {
  return {
    load: () => mcpAuthRecordRead(deps, serverUrl),
    save: async (state) => mcpAuthEnqueue(deps, serverUrl, async () => {
      const key = mcpAuthCredentialKey(serverUrl);
      const previousRaw = await deps.credentials.queries.get({ key });

      await match(
        mcpAuthEpoch(deps, serverUrl) === bind.epoch && mcpAuthSaveEpoch(deps, serverUrl) === bind.saveEpoch,
      )
        .with(false, async () => undefined)
        .with(true, async () => {
          const previous = match(previousRaw)
            .with(P.string, (stored) => mcpAuthRecordParse(stored, serverUrl))
            .with(null, () => undefined)
            .exhaustive();

          const redirect = bind.redirectUrl ?? previous?.redirectUrl;
          const record = redirect === undefined ? state : { ...state, redirectUrl: redirect };

          await deps.credentials.actions.set({
            key,
            value: JSON.stringify(record),
          });

          await match(
            mcpAuthEpoch(deps, serverUrl) === bind.epoch && mcpAuthSaveEpoch(deps, serverUrl) === bind.saveEpoch,
          )
            .with(true, async () => undefined)
            .with(false, async () => {
              await deps.credentials.actions.set({ key, value: previousRaw });
            })
            .exhaustive();
        })
        .exhaustive();
    }),
  };
}

export async function mcpAuthEnqueue<Value>(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
  work: () => Promise<Value>,
): Promise<Value> {
  const previous = deps.writes.get(serverUrl) ?? Promise.resolve();
  const next = previous.then(work, work);
  const settled = next.then(() => undefined, () => undefined);
  deps.writes.set(serverUrl, settled);

  try {
    return await next;
  } finally {
    match(deps.writes.get(serverUrl) === settled)
      .with(true, () => {
        deps.writes.delete(serverUrl);
      })
      .with(false, () => undefined)
      .exhaustive();
  }
}

export function mcpAuthBind(
  deps: McpAuthTypes.McpAuthServiceState,
  serverUrl: string,
  redirectUrl: string,
): McpAuthTypes.McpAuthCachedProvider {
  const epoch = mcpAuthEpoch(deps, serverUrl);
  const saveEpoch = mcpAuthSaveEpoch(deps, serverUrl);
  const existing = deps.providers.get(serverUrl);

  return match(existing)
    .when((value): value is McpAuthTypes.McpAuthCachedProvider => (
      value?.redirectUrl === redirectUrl
      && value.epoch === epoch
      && value.saveEpoch === saveEpoch
    ), (value) => value)
    .otherwise(() => {
      const onRedirect = { current: (_url: URL): undefined => undefined };

      const oauth = new McpOAuthProvider({
        serverUrl,
        redirectUrl,
        clientMetadata: { client_name: MCP_AUTH.clientName },
        store: mcpAuthStateStore(deps, serverUrl, {
          redirectUrl,
          epoch,
          saveEpoch,
        }),
        onRedirect: (url) => onRedirect.current(url),
      });

      const adapted = adaptOAuthProvider(oauth);

      const cached: McpAuthTypes.McpAuthCachedProvider = {
        redirectUrl,
        epoch,
        saveEpoch,
        oauth,
        authProvider: mcpAuthRefreshProvider(adapted, oauth),
        onRedirect,
      };

      deps.providers.set(serverUrl, cached);

      return cached;
    });
}

function mcpAuthRefreshProvider(adapted: AuthProvider, oauth: McpOAuthProvider): AuthProvider {
  return {
    token: () => adapted.token(),
    onUnauthorized: async (context) => {
      const tokens = await oauth.tokens();

      await match(tokens?.refresh_token)
        .with(P.string, async () => {
          try {
            await adapted.onUnauthorized?.(context);
          } catch (error) {
            match(error)
              .with(P.instanceOf(McpOAuthAuthorizationRequiredError), () => undefined)
              .otherwise(() => {
                throw error;
              });
          }
        })
        .otherwise(() => undefined);
    },
  };
}

export async function mcpAuthProvider(
  deps: McpAuthTypes.McpAuthServiceState,
  params: McpAuthTypes.McpAuthServerParams,
): Promise<AuthProvider | undefined> {
  const url = mcpAuthServerUrl(params.serverUrl);
  const record = await mcpAuthRecordRead(deps, url);

  return match(record?.redirectUrl)
    .with(undefined, () => undefined)
    .with(P.string, (redirectUrl) => mcpAuthBind(deps, url, redirectUrl).authProvider)
    .exhaustive();
}

export function mcpAuthPrune(deps: McpAuthTypes.McpAuthServiceState): void {
  const now = Date.now();

  for (const [url, session] of deps.pending) {
    match(now - session.createdAt >= MCP_AUTH.pendingTtlMs)
      .with(true, () => {
        mcpAuthBumpSave(deps, url);
        mcpAuthAbort(deps, url);
      })
      .with(false, () => undefined)
      .exhaustive();
  }
}

export function mcpAuthRetryAfter(deps: McpAuthTypes.McpAuthServiceState): number {
  return match(deps.pending.size)
    .with(0, () => 1)
    .otherwise(() => {
      const oldest = [...deps.pending.values()].sort((left, right) => left.createdAt - right.createdAt)[0];
      return Math.max(1, Math.ceil((oldest.createdAt + MCP_AUTH.pendingTtlMs - Date.now()) / 1000));
    });
}

export function mcpAuthAbort(deps: McpAuthTypes.McpAuthServiceState, serverUrl: string): void {
  match(deps.pending.get(serverUrl))
    .with(P.nullish, () => undefined)
    .otherwise((pending) => {
      pending.controller.abort();
      deps.pending.delete(serverUrl);
    });
}

function mcpAuthSameRedirect(issued: string, callback: string): boolean {
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

export function mcpAuthParseCallback(
  redirectUrl: string,
  state: string,
  callbackUrl: string,
): McpAuthTypes.McpAuthCallback {
  match(mcpAuthSameRedirect(redirectUrl, callbackUrl))
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
