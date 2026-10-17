import { getAgentDir } from '@earendil-works/pi-coding-agent';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { match, P } from 'ts-pattern';
import { mcpDocument, mcpServer } from '../../types/mcp.types';
import { mcpFiles } from './mcp-files.utils';
import type { McpConfig, McpServiceDeps, McpSource } from '../../types/mcp.types';
import type { ResourceMcpCatalog } from '@openbots/contracts/universal';
import type { McpParams } from '@openbots/server/server';

export async function mcpQueryConfig({ root }: McpServiceDeps, { botId, mcpPaths, isInherited }: McpParams): Promise<McpConfig> {
  const defaults = [join(getAgentDir(), 'mcp.json'), join(homedir(), '.agents/mcp.json')];
  const directory = join(root, 'agents', botId);
  const localPaths = [join(directory, '.agents/mcp.json'), join(directory, '.pi/mcp.json')];

  const sharedPaths = match(isInherited)
    .with(true, () => [...defaults.filter(existsSync), ...mcpPaths])
    .with(false, () => [])
    .exhaustive();

  const sources = await Promise.all([...sharedPaths, ...localPaths.filter(existsSync)].map(async (path) => {
    const source = resolve(root, match(path)
      .with('~', () => homedir())
      .when((value) => value.startsWith('~/'), (value) => join(homedir(), value.slice(2)))
      .otherwise((value) => value));

    try {
      const files = await mcpFiles(source);
      return await Promise.all(files.map(mcpQueryConfigRead));
    } catch {
      return [{ source, servers: {}, error: 'Cannot read MCP source.' }];
    }
  }));

  const servers = new Map<string, McpConfig['servers'][number]>();
  const diagnostics: ResourceMcpCatalog['diagnostics'] = [];

  for (const { source, servers: entries, error } of sources.flat()) {
    match(error)
      .with(P.string, (message) => diagnostics.push({ source, message }))
      .otherwise(() => undefined);

    for (const [name, value] of Object.entries(entries)) {
      servers.delete(name);

      match(mcpServer.safeParse(value))
        .with({ success: true }, ({ data }) => {
          servers.set(name, {
            name,
            source,
            config: data,
          });
        })
        .with({ success: false }, () => {
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
