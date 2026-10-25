import { z } from 'zod';
import type { Extension } from '@earendil-works/pi-durable';
import type { PluginCatalog } from '@repo/contracts/universal';

const pluginFunction = z.instanceof(Function);
const pluginObject = z.object({}).loose();
const pluginName = z.string().refine((value) => value.trim().length > 0);

const pluginDefinition = z.object({
  name: pluginName,
  tools: z.array(z.object({
    name: pluginName,
    description: z.string(),
    parameters: pluginObject,
    execute: pluginFunction,
    prepareArguments: pluginFunction.optional(),
    replay: z.enum(['safe', 'unsafe']).optional(),
    executionMode: z.enum(['parallel', 'sequential']).optional(),
    structuredOutputSchema: pluginObject.optional(),
    callers: z.array(z.enum(['model', 'tools'])).optional(),
    deferred: z.literal(true).optional(),
    outputLimits: z.object({
      maxBytes: z.number().optional(),
      maxLines: z.number().optional(),
      retain: z.enum(['head', 'tail']).optional(),
    }).optional(),
  })).optional(),
  sections: z.array(z.object({
    key: z.string(),
    render: pluginFunction,
    tag: z.boolean().optional(),
  })).optional(),
  hooks: z.array(z.object({
    task: pluginName,
    handlers: z.record(z.string(), pluginFunction.optional()),
  })).optional(),
  wraps: z.array(z.union([
    z.object({ tool: pluginName, wrap: pluginFunction }),
    z.object({ section: pluginName, wrap: pluginFunction }),
  ])).optional(),
  tasks: z.array(z.object({
    definition: z.object({
      name: pluginName,
      version: z.number(),
      initial: pluginFunction,
      phases: z.record(z.string(), pluginFunction),
      abort: pluginFunction,
      migrate: pluginFunction.optional(),
      hooks: pluginObject.optional(),
    }),
  })).optional(),
});

export const pluginExtension = z.custom<Extension>((value) => pluginDefinition.safeParse(value).success);

export interface PluginLoaderServiceDeps {
  root: string;
  imports: Map<string, Extension>;
  failures: Map<string, string>;
}

export interface PluginLoadParams {
  botId: string;
  directories: string[];
  isInherited: boolean;
}

export interface PluginLoadResult {
  extensions: Extension[];
  diagnostics: PluginCatalog['diagnostics'];
}

export interface PluginFile {
  name: string;
  path: string;
}

export interface PluginScan {
  plugins: PluginFile[];
  diagnostics: PluginCatalog['diagnostics'];
}
