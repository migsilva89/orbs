import { secretBrokerActionPrepare } from './secret-broker-action.prepare';
import { secretBrokerQueryRedact } from './secret-broker-query.redact';
import type * as SecretBrokerTypes from '../../types/secret-broker.types';

/** Gives bash commands stored secrets the way the owner chose, and keeps real values out of tool output. */
export function makeSecretBrokerService(deps: SecretBrokerTypes.SecretBrokerServiceDeps) {
  return {
    actions: {
      prepare: (execution: SecretBrokerTypes.SecretExecution) => secretBrokerActionPrepare(deps, { execution }),
    },
    queries: {
      rules: () => deps.source.queries.rules(),
      redact: (params: SecretBrokerTypes.SecretRedactParams) => secretBrokerQueryRedact(deps, params),
    },
  };
}

export type SecretBrokerService = ReturnType<typeof makeSecretBrokerService>;
