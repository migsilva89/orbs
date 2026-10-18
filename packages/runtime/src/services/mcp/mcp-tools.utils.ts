import { Type } from '@earendil-works/pi-ai';
import { defineTool } from '@earendil-works/pi-durable';
import { toLlmContent } from '@earendil-works/pi-mcp';
import { mcpToolName } from './mcp.utils';
import type { McpConnection } from '../../types/mcp.types';
import type { JsonObject } from '@earendil-works/pi-durable';
import type { Tool } from '@earendil-works/pi-mcp';

export function mcpTools(connection: McpConnection, server: string, tools: Tool[]) {
  return tools.map((tool) => defineTool({
    name: mcpToolName(server, tool.name, `${connection.fingerprint}:${JSON.stringify(tool)}`),
    description: tool.description ?? tool.name,
    parameters: Type.Unsafe<JsonObject>({
      ...tool.inputSchema,
      type: 'object',
      properties: tool.inputSchema.properties ?? {},
    }),
    replay: 'unsafe',
    execute: async (args, api, context) => {
      try {
        const result = await connection.client.callTool(tool.name, args, {
          signal: context.abortSignal,
          timeoutMs: 60_000,
          onProgress: ({ progress, total }) => api.output(`MCP progress: ${progress}${total === undefined ? '' : `/${total}`}\n`),
        });

        return { output: toLlmContent(result), isError: result.isError === true };
      } catch {
        context.abortSignal?.throwIfAborted();
        return { output: [{ type: 'text' as const, text: 'MCP tool call failed.' }], isError: true };
      }
    },
  }));
}
