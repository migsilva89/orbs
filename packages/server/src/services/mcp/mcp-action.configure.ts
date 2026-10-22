import { match } from 'ts-pattern';
import { mcpQuerySettings } from './mcp-query.settings';
import { MCP } from './mcp.constants';
import type { McpServiceDeps } from '../../types/mcp.types';
import type { McpConfigureInput } from '@repo/contracts/universal';

export async function mcpActionConfigure(deps: McpServiceDeps, { paths }: McpConfigureInput) {
  await match(paths)
    .with(undefined, () => undefined)
    .otherwise((value) => deps.settings.actions.set({
      records: [{
        key: MCP.pathsSetting,
        value: JSON.stringify(value),
      }],
    }));

  return mcpQuerySettings(deps);
}
