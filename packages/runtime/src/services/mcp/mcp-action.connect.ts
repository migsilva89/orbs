import { McpClient, StdioTransport, StreamableHttpTransport } from '@earendil-works/pi-mcp';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { match, P } from 'ts-pattern';
import { mcpTools } from './mcp-tools.utils';
import { mcpFingerprint } from './mcp.utils';
import type { McpClientServiceDeps, McpConnection, McpConnectParams } from '../../types/mcp.types';

export async function mcpActionConnect(deps: McpClientServiceDeps, { botId, entry }: McpConnectParams) {
  const key = `${botId}:${entry.name}`;
  const fingerprint = mcpFingerprint(entry);
  const sourceFingerprint = entry.sourceFingerprint ?? fingerprint;
  const previous = deps.connections.get(key);

  return match(previous)
    .when((connection): connection is McpConnection => connection?.fingerprint === fingerprint && !connection.error
      && ['connecting', 'connected', 'idle'].includes(connection.client.connectionState), async (connection) => {
      await connection.ready;

      return match(connection.hasToolChanges)
        .with(true, async () => {
          await mcpActionConnectTools(connection, entry.name);
          return connection.tools;
        })
        .with(false, () => connection.tools)
        .exhaustive();
    })
    .otherwise(async () => {
      const directory = join(deps.root, 'agents', botId);

      const client = new McpClient({
        name: 'openbots',
        version: '1.0.0',
        requestTimeoutMs: 10_000,
        roots: [{ uri: pathToFileURL(directory).href, name: botId }],
      });

      const connection: McpConnection = {
        fingerprint,
        sourceFingerprint,
        client,
        tools: [],
        catalog: [],
        ready: Promise.resolve(),
        hasToolChanges: false,
      };

      deps.connections.set(key, connection);
      client.onNotification('notifications/tools/list_changed', () => {
        connection.hasToolChanges = true;
      });

      connection.ready = (async () => {
        try {
          await previous?.client.close();
          await previous?.ready;

          const transport = match(entry.config)
            .with({ command: P.string }, (config) => new StdioTransport({
              command: config.command,
              args: config.args,
              env: config.env,
              cwd: resolve(directory, config.cwd ?? '.'),
            }))
            .otherwise((config) => new StreamableHttpTransport({ url: config.url, headers: config.headers }));

          await client.connect(transport);
          await mcpActionConnectTools(connection, entry.name);
        } catch {
          connection.error = 'Cannot connect to MCP server.';
          await client.close();
        }
      })();

      await connection.ready;

      return connection.tools;
    });

  async function mcpActionConnectTools(connection: McpConnection, server: string): Promise<void> {
    try {
      connection.hasToolChanges = false;
      const tools = await connection.client.listTools();
      const registrations = mcpTools(connection, server, tools);
      connection.tools = registrations;

      connection.catalog = tools.map((tool, index) => ({
        name: tool.name,
        runtimeName: registrations[index].name,
        title: tool.title ?? tool.name,
        description: tool.description ?? '',
      }));
    } catch {
      connection.tools = [];
      connection.catalog = [];
      connection.error = 'Cannot discover MCP tools.';
      await connection.client.close();
    }
  }
}
