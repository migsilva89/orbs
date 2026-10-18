import { settingsActionSet } from './settings-action.set';
import { settingsQueryGet } from './settings-query.get';
import type { SettingsGetParams, SettingsServiceDeps, SettingsSetParams } from '../../types/settings.types';

export function makeSettingsService(deps: SettingsServiceDeps) {
  return {
    actions: {
      set: (params: SettingsSetParams) => settingsActionSet(deps, params),
    },
    queries: {
      get: (params: SettingsGetParams) => settingsQueryGet(deps, params),
    },
  };
}

export type SettingsService = ReturnType<typeof makeSettingsService>;
