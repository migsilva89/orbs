import type { McpServiceDeps } from '../../types/mcp.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function mcpActionRelease({ clients }: McpServiceDeps, { botId }: BotGetInput) {
  await clients.actions.prepare({ botId, config: { servers: [], diagnostics: [] } });
}
