import { settingsActionEnsure } from './settings-action.ensure';
import { settingsActionSet } from './settings-action.set';
import { settingsQueryGet } from './settings-query.get';
import type * as SettingsTypes from '../../types/settings.types';

export function makeSettingsService(deps: SettingsTypes.SettingsServiceDeps) {
  return {
    actions: {
      ensure: (params: SettingsTypes.SettingsRecord) => settingsActionEnsure(deps, params),
      set: (params: SettingsTypes.SettingsSetParams) => settingsActionSet(deps, params),
    },
    queries: {
      get: (params: SettingsTypes.SettingsGetParams) => settingsQueryGet(deps, params),
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
