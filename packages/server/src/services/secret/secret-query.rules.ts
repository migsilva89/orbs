import { secretRules } from '@openbots/contracts/universal';
import { SECRET } from './secret.constants';
import type { SecretServiceDeps } from '../../types/secret.types';

export async function secretQueryRules({ settings }: SecretServiceDeps) {
  const stored = await settings.queries.get({ keys: [SECRET.rulesSetting] });

  return secretRules.parse(JSON.parse(stored.find(({ key }) => key === SECRET.rulesSetting)?.value ?? '[]'));
}
