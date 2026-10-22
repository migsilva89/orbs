import { mcpAuthTarget } from './mcp-auth.utils';
import type { McpAuthServiceDeps } from '../../types/mcp-auth.types';
import type { McpAuthTarget } from '@repo/contracts/universal';

export async function mcpAuthActionLogout(deps: McpAuthServiceDeps, params: McpAuthTarget) {
  const serverUrl = await mcpAuthTarget(deps, params);
  await deps.oauth.actions.logout({ serverUrl });
}
