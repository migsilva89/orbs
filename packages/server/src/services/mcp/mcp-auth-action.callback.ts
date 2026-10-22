import { match } from 'ts-pattern';
import type { McpAuthServiceDeps } from '../../types/mcp-auth.types';
import type { McpAuthCallbackParams } from '@repo/runtime/server';

export async function mcpAuthActionCallback(deps: McpAuthServiceDeps, params: McpAuthCallbackParams) {
  const result = await deps.oauth.actions.callback(params);

  await match(result.status)
    .with('connected', () => deps.bots.actions.configure({ botId: result.botId }))
    .with('failed', () => undefined)
    .exhaustive();

  return result;
}
