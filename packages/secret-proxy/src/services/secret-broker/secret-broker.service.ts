import { secretBrokerActionPrepare } from './secret-broker-action.prepare';
import { secretBrokerQueryRedact } from './secret-broker-query.redact';
import type * as SecretBrokerTypes from '../../types/secret-broker.types';

export function makeSecretBrokerService(deps: SecretBrokerTypes.SecretBrokerServiceDeps) {
  return {
    actions: {
      prepare: (execution: SecretBrokerTypes.SecretBrokerExecution) => secretBrokerActionPrepare(deps, { execution }),
    },
    queries: {
      rules: () => deps.source.queries.rules(),
      redact: (params: SecretBrokerTypes.SecretBrokerRedactParams) => secretBrokerQueryRedact(deps, params),
    },
  };
}

export type SecretBrokerService = ReturnType<typeof makeSecretBrokerService>;
