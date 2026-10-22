import { mcpSettings } from '@repo/contracts/universal';
import { MCP } from './mcp.constants';
import type { McpServiceDeps } from '../../types/mcp.types';

export async function mcpQuerySettings({ settings }: McpServiceDeps) {
  const stored = await settings.queries.get({ keys: [MCP.pathsSetting] });
  const record = stored.find(({ key }) => key === MCP.pathsSetting);

  return mcpSettings.parse({
    paths: record === undefined ? MCP.defaults.paths : JSON.parse(record.value),
  });
}
