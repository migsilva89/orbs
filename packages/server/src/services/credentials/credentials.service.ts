import { credentialsActionSet } from './credentials-action.set';
import { credentialsQueryGet } from './credentials-query.get';
import { credentialsQueryHas } from './credentials-query.has';
import { credentialsQueryList } from './credentials-query.list';
import type { CredentialsGetParams, CredentialsServiceDeps, CredentialsSetParams } from '../../types/credentials.types';

export function makeCredentialsService(deps: CredentialsServiceDeps) {
  return {
    actions: {
      set: (params: CredentialsSetParams) => credentialsActionSet(deps, params),
    },
    queries: {
      list: () => credentialsQueryList(deps),
      get: (params: CredentialsGetParams) => credentialsQueryGet(deps, params),
      has: (params: CredentialsGetParams) => credentialsQueryHas(deps, params),
    },
  };
}

export type CredentialsService = ReturnType<typeof makeCredentialsService>;
