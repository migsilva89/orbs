import { toolQueryAlwaysAllowed } from './tool-query.always-allowed';
import { TOOL } from './tool.constants';
import type { ToolAllowAlwaysParams, ToolServiceDeps } from '../../types/tool.types';

export async function toolActionAllowAlways(deps: ToolServiceDeps, { botId, toolName }: ToolAllowAlwaysParams) {
  const allowed = await toolQueryAlwaysAllowed(deps, { botId });

  await deps.settings.actions.set({
    records: [{
      key: `${TOOL.alwaysAllowSettingPrefix}${botId}`,
      value: JSON.stringify([...new Set([...allowed, toolName])]),
    }],
  });
}
