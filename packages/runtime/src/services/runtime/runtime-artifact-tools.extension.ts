import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import {
  artifactToolCreate,
  artifactToolCreateParameters,
  artifactToolGet,
  artifactToolGetParameters,
  artifactToolUpdate,
  artifactToolUpdateParameters,
} from '../../types/artifact-tool.types';
import { runtimeToolOutput, runtimeToolTarget } from './runtime-tool.utils';
import type { ArtifactToolDeps } from '../../types/artifact-tool.types';

export function runtimeArtifactToolsExtension(deps: ArtifactToolDeps) {
  const list = defineTool({
    name: 'bot_artifact_list',
    description: m.ui_tool_bot_artifact_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const target = await runtimeToolTarget(api, context);
      return runtimeToolOutput(await deps.artifacts.queries.list(target, context));
    },
  });

  const get = defineTool({
    name: 'bot_artifact_get',
    description: m.ui_tool_bot_artifact_get_description(),
    parameters: artifactToolGetParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = artifactToolGet.parse(params);
      const target = await runtimeToolTarget(api, context);
      return runtimeToolOutput(await deps.artifacts.queries.get({ ...input, ...target }, context));
    },
  });

  const blocks = defineTool({
    name: 'bot_artifact_blocks',
    description: m.ui_tool_bot_artifact_blocks_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async () => runtimeToolOutput(deps.artifacts.queries.blocks()),
  });

  const create = defineTool({
    name: 'bot_artifact_create',
    description: m.ui_tool_bot_artifact_create_description(),
    parameters: artifactToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = artifactToolCreate.parse(params);
      const target = await runtimeToolTarget(api, context);
      return runtimeToolOutput(await deps.artifacts.actions.create({ ...input, ...target }, context));
    },
  });

  const update = defineTool({
    name: 'bot_artifact_update',
    description: m.ui_tool_bot_artifact_update_description(),
    parameters: artifactToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = artifactToolUpdate.parse(params);
      const target = await runtimeToolTarget(api, context);
      return runtimeToolOutput(await deps.artifacts.actions.update({ ...input, ...target }, context));
    },
  });

  return {
    extension: defineExtension({ name: 'bots.artifact-tools', tools: [list, get, blocks, create, update] }),
    readOnlyTools: [list, get, blocks],
  };
}
