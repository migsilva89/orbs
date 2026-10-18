import { toolApprovalRules } from '@openbots/contracts/universal';
import { TOOL } from './tool.constants';
import type { ToolServiceDeps } from '../../types/tool.types';

export async function toolQuerySettings({ settings, credentials }: ToolServiceDeps) {
  const [isJevConfigured, stored] = await Promise.all([
    credentials.queries.has({ key: TOOL.jevCredential }),
    settings.queries.get({ keys: [TOOL.approvalRulesSetting] }),
  ]);

  const record = stored.find(({ key }) => key === TOOL.approvalRulesSetting);

  return {
    isJevConfigured,
    approvalRules: toolApprovalRules.parse(JSON.parse(record?.value ?? '[]')),
  };
}
