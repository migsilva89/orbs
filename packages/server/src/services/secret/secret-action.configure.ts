import { secretQuerySettings } from './secret-query.settings';
import { SECRET } from './secret.constants';
import type { SecretServiceDeps } from '../../types/secret.types';
import type { SecretConfigureInput } from '@repo/contracts/universal';

export async function secretActionConfigure(deps: SecretServiceDeps, { mode }: SecretConfigureInput) {
  await deps.settings.actions.set({ records: mode ? [{ key: SECRET.modeSetting, value: mode }] : [] });

  return secretQuerySettings(deps);
}
