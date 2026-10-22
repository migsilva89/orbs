import type { McpServiceDeps } from '../../types/mcp.types';
import type { BotGetInput } from '@repo/contracts/universal';

export async function mcpActionRelease({ clients }: McpServiceDeps, { botId }: BotGetInput) {
  await clients.actions.prepare({ botId, config: { servers: [], diagnostics: [] } });
}
