import { match, P } from 'ts-pattern';
import { toolQuerySettings } from './tool-query.settings';
import { TOOL } from './tool.constants';
import type { ToolServiceDeps } from '../../types/tool.types';
import type { ToolConfigureInput } from '@openbots/contracts/universal';

export async function toolActionConfigure(deps: ToolServiceDeps, { jevApiKey, approvalRules }: ToolConfigureInput) {
  await match(jevApiKey)
    .with(P.union(P.string, null), (value) => deps.credentials.actions.set({ key: TOOL.jevCredential, value }))
    .otherwise(() => undefined);

  await match(approvalRules)
    .with(P.nonNullable, (rules) => {
      const setting = {
        key: TOOL.approvalRulesSetting,
        value: JSON.stringify(rules),
        updatedAt: Date.now(),
      };

      return deps.database.db.insertInto('settings').values(setting)
        .onConflict((conflict) => conflict.column('key').doUpdateSet(setting)).execute();
    })
    .otherwise(() => undefined);

  return toolQuerySettings(deps);
}
