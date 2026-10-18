import { Errors } from '@openbots/errors/universal';
import { createHash } from 'node:crypto';
import { match, P } from 'ts-pattern';
import { mcpQueryConfig } from './mcp-query.config';
import type { McpPrepareParams, McpServiceDeps } from '../../types/mcp.types';
import type { McpEntry } from '@openbots/runtime/server';

export async function mcpActionPrepare(deps: McpServiceDeps, { bot, settings }: McpPrepareParams) {
  const config = await mcpQueryConfig(deps, {
    botId: bot.id,
    paths: settings.paths,
    isInherited: bot.inherit.includes('mcp'),
  });

  const results = await Promise.allSettled(config.servers.map(async (entry) => match(entry.config.enabled !== false && entry.config.disabled !== true)
    .with(false, () => entry)
    .with(true, async () => ({
      ...entry,
      sourceFingerprint: createHash('sha256').update(JSON.stringify(entry)).digest('hex'),
      config: await mcpPrepareConfig(entry),
    }))
    .exhaustive()));

  const servers = results.flatMap((result, index) => match(result)
    .with({ status: 'fulfilled' }, ({ value }) => [value])
    .with({ status: 'rejected' }, () => {
      const entry = config.servers[index];
      config.diagnostics.push({
        source: entry.source,
        server: entry.name,
        message: 'Cannot prepare MCP server. Check its credentials and connection settings.',
      });

      return [];
    })
    .exhaustive());

  return deps.clients.actions.prepare({
    botId: bot.id,
    config: { ...config, servers },
  });

  async function mcpPrepareConfig(entry: McpEntry): Promise<McpEntry['config']> {
    return match(entry.config)
      .with({ command: P.string }, async ({ envCredentials, ...server }) => ({
        ...server,
        env: { ...server.env, ...await mcpPrepareSecrets(envCredentials) },
      }))
      .otherwise(async ({ headerCredentials, ...server }) => {
        const headers = new Headers(server.headers);
        const values = await mcpPrepareSecrets(headerCredentials);

        for (const [name, value] of Object.entries(values)) {
          headers.set(name, value);
        }

        return { ...server, headers: Object.fromEntries(headers) };
      });
  }

  async function mcpPrepareSecrets(references: Record<string, string> = {}): Promise<Record<string, string>> {
    const entries = await Promise.all(Object.entries(references).map(async ([name, key]) => {
      const value = await deps.credentials.queries.get({ key });

      const secret = match(value)
        .with(P.string, (stored) => stored)
        .with(null, () => {
          throw new Errors.NOT_FOUND({ resource: 'credential', resourceId: key });
        })
        .exhaustive();

      return [name, secret] as const;
    }));

    return Object.fromEntries(entries);
  }
}
