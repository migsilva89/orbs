import { CredentialSynchronizationError } from '@earendil-works/pi-coding-agent';
import { Errors } from '@repo/errors/universal';
import * as m from '@repo/i18n/messages';
import { log } from '@repo/logger/server';
import { match, P } from 'ts-pattern';
import { PROVIDER } from './provider.constants';
import {
  providerFinish,
  providerPromptView,
  providerPruneTerminal,
  providerPushEvent,
  providerRetryAfterSeconds,
  providerSessionView,
  providerSweep,
} from './provider.utils';
import type * as ProviderTypes from '../../types/provider.types';
import type { AuthPrompt } from '@earendil-works/pi-ai';

export function providerActionLogin(deps: ProviderTypes.ProviderServiceDeps, params: ProviderTypes.ProviderLoginParams) {
  providerSweep(deps);
  providerPruneTerminal(deps);

  const provider = match(deps.models.getProvider(params.providerId))
    .with(P.nonNullable, (value) => value)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'provider', resourceId: params.providerId });
    });

  const method = match(params.authType)
    .with('oauth', () => provider.auth.oauth)
    .with('api_key', () => provider.auth.apiKey)
    .exhaustive();

  match(method)
    .when((value) => value !== undefined && 'login' in value, () => undefined)
    .otherwise(() => {
      throw new Errors.VALIDATION_ERROR({
        fields: { authType: { message: 'validation_provider_login_unsupported' } },
      });
    });

  const pending = [...deps.sessions.values()].filter((session) => session.status === 'pending');

  match(pending.some((session) => session.providerId === params.providerId || session.deviceId === params.deviceId))
    .with(true, () => {
      throw new Errors.CONFLICT();
    })
    .with(false, () => undefined)
    .exhaustive();

  match(pending.length >= PROVIDER.maxSessions)
    .with(true, () => {
      throw new Errors.RATE_LIMITED({ retryAfter: providerRetryAfterSeconds(deps) });
    })
    .with(false, () => undefined)
    .exhaustive();

  const abort = new AbortController();

  const session: ProviderTypes.ProviderLoginRecord = {
    id: crypto.randomUUID(),
    providerId: params.providerId,
    authType: params.authType,
    deviceId: params.deviceId,
    status: 'pending',
    expiresAt: Date.now() + PROVIDER.sessionTimeoutMs,
    abort,
    events: [],
    done: Promise.resolve(),
  };

  session.timeout = setTimeout(() => {
    providerFinish(session, 'cancelled');
    deps.sessions.delete(session.id);
  }, PROVIDER.sessionTimeoutMs);

  session.done = deps.models.login(params.providerId, params.authType, {
    signal: abort.signal,
    prompt: (prompt) => providerWaitForPrompt(session, prompt),
    notify: (event) => providerPushEvent(session, event),
  }, {
    agentName: PROVIDER.agentName,
    getDeviceId: () => params.serverId,
  }).then(() => {
    providerFinish(session, 'completed');
  }).catch((error: unknown) => {
    match(error)
      .with(P.instanceOf(CredentialSynchronizationError), () => {
        providerFinish(session, 'completed');
      })
      .otherwise(() => {
        match(session.status)
          .with('pending', () => {
            match(abort.signal.aborted)
              .with(true, () => providerFinish(session, 'cancelled'))
              .with(false, () => {
                log.error({
                  tag: 'provider',
                  message: 'Cannot sign in to the provider.',
                  providerId: params.providerId,
                  authType: params.authType,
                  error,
                });
                session.error = m.ui_provider_login_failed();
                providerFinish(session, 'failed');
              })
              .exhaustive();
          })
          .otherwise(() => undefined);
      });
  });

  deps.sessions.set(session.id, session);

  return providerSessionView(session);
}

function providerWaitForPrompt(session: ProviderTypes.ProviderLoginRecord, prompt: AuthPrompt) {
  session.abort.signal.throwIfAborted();
  prompt.signal?.throwIfAborted();

  const promptId = crypto.randomUUID();

  return new Promise<string>((resolve, reject) => {
    const finish = (settle: () => void) => {
      session.abort.signal.removeEventListener('abort', onAbort);
      prompt.signal?.removeEventListener('abort', onPromptAbort);
      match(session.pending?.promptId === promptId)
        .with(true, () => {
          session.pending = undefined;
          session.prompt = undefined;
        })
        .with(false, () => undefined)
        .exhaustive();
      settle();
    };

    const onAbort = () => finish(() => reject(new Error('Login cancelled')));
    const onPromptAbort = () => finish(() => reject(new Error('Login cancelled')));

    session.prompt = providerPromptView(promptId, prompt);
    session.pending = {
      promptId,
      resolve: (answer) => finish(() => resolve(answer)),
      reject: (error) => finish(() => reject(error)),
    };

    session.abort.signal.addEventListener('abort', onAbort, { once: true });
    prompt.signal?.addEventListener('abort', onPromptAbort, { once: true });
  });
}
