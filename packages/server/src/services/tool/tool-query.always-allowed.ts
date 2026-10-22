import { toolAlwaysAllowed } from '@repo/contracts/universal';
import { TOOL } from './tool.constants';
import type { ToolAlwaysAllowedParams, ToolServiceDeps } from '../../types/tool.types';

export async function toolQueryAlwaysAllowed({ settings }: ToolServiceDeps, { botId }: ToolAlwaysAllowedParams) {
  const key = `${TOOL.alwaysAllowSettingPrefix}${botId}`;
  const stored = await settings.queries.get({ keys: [key] });

  return toolAlwaysAllowed.parse(JSON.parse(stored.find((record) => record.key === key)?.value ?? '[]'));
}
