import { getAgentDir } from '@earendil-works/pi-coding-agent';
import { mcpDocument, mcpServer } from '@openbots/runtime/server';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { match, P } from 'ts-pattern';
import { mcpFiles } from './mcp-files.utils';
import type { McpConfigParams, McpServiceDeps } from '../../types/mcp.types';
import type { McpCatalog } from '@openbots/contracts/universal';
import type { McpConfig, McpSource } from '@openbots/runtime/server';

export async function mcpQueryConfig(
  { root }: McpServiceDeps,
  { botId, paths, isInherited }: McpConfigParams,
): Promise<McpConfig> {
  const defaults = [join(getAgentDir(), 'mcp.json'), join(homedir(), '.agents/mcp.json')];
  const directory = join(root, 'agents', botId);
  const localPaths = [join(directory, '.agents/mcp.json'), join(directory, '.pi/mcp.json')];

  const sharedPaths = match(isInherited)
    .with(true, () => [...defaults.filter(existsSync), ...paths])
    .with(false, () => [])
    .exhaustive();

  const sharedSources = sharedPaths.map((path) => ({ path, isBotLocal: false }));
  const localSources = localPaths.filter(existsSync).map((path) => ({ path, isBotLocal: true }));

  const sources = await Promise.all([...sharedSources, ...localSources].map(async ({ path, isBotLocal }) => {
    const source = resolve(root, match(path)
      .with('~', () => homedir())
      .when((value) => value.startsWith('~/'), (value) => join(homedir(), value.slice(2)))
      .otherwise((value) => value));

    try {
      const files = await mcpFiles(source);
      const documents = await Promise.all(files.map(mcpQueryConfigRead));

      return documents.map((document) => ({ ...document, isBotLocal }));
    } catch {
      return [{ source, servers: {}, error: 'Cannot read MCP source.', isBotLocal }];
    }
  }));

  const servers = new Map<string, McpConfig['servers'][number]>();
  const diagnostics: McpCatalog['diagnostics'] = [];

  for (const { source, servers: entries, error, isBotLocal } of sources.flat()) {
    match(error)
      .with(P.string, (message) => diagnostics.push({ source, message }))
      .otherwise(() => undefined);

    for (const [name, value] of Object.entries(entries)) {
      servers.delete(name);

      match({ result: mcpServer.safeParse(value), isBotLocal })
        // SAFETY: a bot can write its own folder, so its MCP files must not pull stored secrets.
        .with({
          result: { success: true, data: P.union({ envCredentials: P.nonNullable }, { headerCredentials: P.nonNullable }) },
          isBotLocal: true,
        }, () => {
          diagnostics.push({
            source,
            server: name,
            message: 'Bot MCP files cannot use stored credentials. Move this server to a shared MCP file.',
          });
        })
        .with({ result: { success: true } }, ({ result: { data } }) => {
          servers.set(name, {
            name,
            source,
            config: data,
            isBotLocal,
          });
        })
        .with({ result: { success: false } }, () => {
          diagnostics.push({
            source,
            server: name,
            message: 'Invalid MCP server. Expected one stdio command or HTTP URL.',
          });
        })
        .exhaustive();
    }
  }

  return { servers: [...servers.values()], diagnostics };

  async function mcpQueryConfigRead(source: string): Promise<McpSource> {
    try {
      const document = mcpDocument.parse(JSON.parse(await readFile(source, 'utf8')));
      return { source, servers: document.mcpServers };
    } catch {
      return { source, servers: {}, error: 'Cannot read MCP file. Expected JSON with an mcpServers object.' };
    }
  }
}
