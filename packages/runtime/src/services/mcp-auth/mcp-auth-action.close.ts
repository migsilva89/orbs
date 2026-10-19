import { mcpAuthBump } from './mcp-auth.utils';
import type * as McpAuthTypes from '../../types/mcp-auth.types';

export async function mcpAuthActionClose(deps: McpAuthTypes.McpAuthServiceState) {
  const urls = new Set([...deps.pending.keys(), ...deps.providers.keys()]);

  for (const url of urls) {
    deps.pending.get(url)?.controller.abort();
    mcpAuthBump(deps, url);
  }

  deps.pending.clear();
  deps.providers.clear();
  await Promise.all([...deps.writes.values()].map((write) => write.catch(() => undefined)));
}
