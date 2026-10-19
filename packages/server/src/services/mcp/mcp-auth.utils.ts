import type { McpAuthServiceDeps } from '../../types/mcp-auth.types';
import type { McpAuthTarget } from '@openbots/contracts/universal';

export async function mcpAuthTarget({ bots, mcp }: McpAuthServiceDeps, { botId, name }: McpAuthTarget) {
  const bot = await bots.queries.get({ botId });
  return mcp.queries.target({ bot, name });
}
