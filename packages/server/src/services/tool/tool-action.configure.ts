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
    .with(P.nonNullable, (rules) => deps.settings.actions.set({
      records: [{
        key: TOOL.approvalRulesSetting,
        value: JSON.stringify(rules),
      }],
    }))
    .otherwise(() => undefined);

  return toolQuerySettings(deps);
}
