import { secretQueryRules } from './secret-query.rules';
import { SECRET } from './secret.constants';
import type { SecretServiceDeps } from '../../types/secret.types';
import type { SecretRemoveInput } from '@openbots/contracts/universal';

export async function secretActionRemove(deps: SecretServiceDeps, { name }: SecretRemoveInput) {
  const rules = await secretQueryRules(deps);

  await deps.settings.actions.set({
    records: [{ key: SECRET.rulesSetting, value: JSON.stringify(rules.filter((rule) => rule.name !== name)) }],
  });
  await deps.credentials.actions.set({ key: `${SECRET.credentialPrefix}${name}`, value: null });
}
