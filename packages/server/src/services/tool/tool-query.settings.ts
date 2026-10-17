import { toolApprovalRules } from '@openbots/contracts/universal';
import { TOOL } from './tool.constants';
import type { ToolServiceDeps } from '../../types/tool.types';

export async function toolQuerySettings({ database, credentials }: ToolServiceDeps) {
  const [isJevConfigured, stored] = await Promise.all([
    credentials.queries.has({ key: TOOL.jevCredential }),
    database.db.selectFrom('settings').select('value')
      .where('key', '=', TOOL.approvalRulesSetting).executeTakeFirst(),
  ]);

  return {
    isJevConfigured,
    approvalRules: toolApprovalRules.parse(JSON.parse(stored?.value ?? '[]')),
  };
}
