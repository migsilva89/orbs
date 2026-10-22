import { secretQueryRules } from './secret-query.rules';
import { SECRET } from './secret.constants';
import type { SecretServiceDeps } from '../../types/secret.types';
import type { SecretSaveInput } from '@openbots/contracts/universal';

export async function secretActionSave(deps: SecretServiceDeps, { name, hosts, value }: SecretSaveInput) {
  const rules = await secretQueryRules(deps);

  await deps.credentials.actions.set({ key: `${SECRET.credentialPrefix}${name}`, value });
  await deps.settings.actions.set({
    records: [{ key: SECRET.rulesSetting, value: JSON.stringify([...rules.filter((rule) => rule.name !== name), { name, hosts }]) }],
  });
}
