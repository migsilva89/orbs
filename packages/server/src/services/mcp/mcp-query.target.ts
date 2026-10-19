import { Errors } from '@openbots/errors/universal';
import { match, P } from 'ts-pattern';
import { mcpQueryConfig } from './mcp-query.config';
import { mcpQuerySettings } from './mcp-query.settings';
import type { McpServiceDeps, McpTargetParams } from '../../types/mcp.types';

export async function mcpQueryTarget(deps: McpServiceDeps, { bot, name }: McpTargetParams) {
  const settings = await mcpQuerySettings(deps);

  const config = await mcpQueryConfig(deps, {
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('mcp'),
  });

  return match(config.servers.find((entry) => entry.name === name))
    .with({ config: { url: P.string, enabled: P.optional(P.not(false)), disabled: P.optional(P.not(true)) } }, (entry) => entry.config.url)
    .otherwise(() => {
      throw new Errors.NOT_FOUND({ resource: 'mcp', resourceId: name });
    });
}
