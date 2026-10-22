import { secretProxyActionStart } from './secret-proxy-action.start';
import { secretProxyActionStop } from './secret-proxy-action.stop';
import { secretProxyQueryEnv } from './secret-proxy-query.env';
import { secretProxyPlaceholder } from './secret-proxy.utils';
import type * as SecretProxyTypes from '../../types/secret-proxy.types';

/** A local HTTPS proxy: commands hold placeholders, and real values are swapped in only on requests to allowed hosts. */
export function makeSecretProxyService(params: SecretProxyTypes.SecretProxyServiceParams) {
  const deps: SecretProxyTypes.SecretProxyServiceDeps = {
    ...params,
    state: { server: null, starting: null, swapped: new Map() },
  };

  return {
    actions: {
      start: () => secretProxyActionStart(deps),
      stop: () => secretProxyActionStop(deps),
    },
    queries: {
      env: () => secretProxyQueryEnv(deps),
      placeholder: ({ name }: SecretProxyTypes.SecretPlaceholderParams) => secretProxyPlaceholder(name),
    },
  };
}

export type SecretProxyService = ReturnType<typeof makeSecretProxyService>;
