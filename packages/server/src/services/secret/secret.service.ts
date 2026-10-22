import { secretActionConfigure } from './secret-action.configure';
import { secretActionRemove } from './secret-action.remove';
import { secretActionSave } from './secret-action.save';
import { secretQueryRules } from './secret-query.rules';
import { secretQuerySettings } from './secret-query.settings';
import { secretQueryValue } from './secret-query.value';
import type * as SecretTypes from '../../types/secret.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeSecretService(deps: SecretTypes.SecretServiceDeps) {
  return {
    actions: {
      save: (params: UniversalTypes.SecretSaveInput) => secretActionSave(deps, params),
      remove: (params: UniversalTypes.SecretRemoveInput) => secretActionRemove(deps, params),
      configure: (params: UniversalTypes.SecretConfigureInput) => secretActionConfigure(deps, params),
    },
    queries: {
      rules: () => secretQueryRules(deps),
      value: (params: SecretTypes.SecretValueParams) => secretQueryValue(deps, params),
      settings: () => secretQuerySettings(deps),
    },
  };
}

export type SecretService = ReturnType<typeof makeSecretService>;
