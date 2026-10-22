import { TOOL_APPROVAL, toolApprovalRules, toolApprovalTimeout } from '@repo/contracts/universal';
import { TOOL } from './tool.constants';
import type { ToolServiceDeps } from '../../types/tool.types';

export async function toolQuerySettings({ settings, credentials }: ToolServiceDeps) {
  const [isJevConfigured, stored] = await Promise.all([
    credentials.queries.has({ key: TOOL.jevCredential }),
    settings.queries.get({ keys: [TOOL.approvalRulesSetting, TOOL.approvalTimeoutSetting] }),
  ]);

  const rules = stored.find(({ key }) => key === TOOL.approvalRulesSetting);
  const timeout = stored.find(({ key }) => key === TOOL.approvalTimeoutSetting);

  return {
    isJevConfigured,
    approvalRules: toolApprovalRules.parse(JSON.parse(rules?.value ?? '[]')),
    approvalTimeoutMinutes: toolApprovalTimeout.catch(TOOL_APPROVAL.defaultTimeoutMinutes).parse(Number(timeout?.value)),
  };
}
