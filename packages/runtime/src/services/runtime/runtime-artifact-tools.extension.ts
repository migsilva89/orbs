import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import * as m from '@repo/i18n/messages';
import { match, P } from 'ts-pattern';
import {
  artifactToolCreate,
  artifactToolCreateParameters,
  artifactToolGet,
  artifactToolGetParameters,
  artifactToolUpdate,
  artifactToolUpdateParameters,
} from '../../types/runtime-artifact.types';
import { runtimeBot } from './runtime.constants';
import type { RuntimeArtifactToolsDeps } from '../../types/runtime-artifact.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';
import type { Artifact, ArtifactSummary } from '@repo/contracts/universal';

export function runtimeArtifactToolsExtension(deps: RuntimeArtifactToolsDeps) {
  const list = defineTool({
    name: 'bot_artifact_list',
    description: m.ui_tool_bot_artifact_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const target = await runtimeArtifactTarget(api, context);
      return runtimeArtifactOutput(await deps.artifacts.queries.list(target, context));
    },
  });

  const get = defineTool({
    name: 'bot_artifact_get',
    description: m.ui_tool_bot_artifact_get_description(),
    parameters: artifactToolGetParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = artifactToolGet.parse(params);
      const target = await runtimeArtifactTarget(api, context);
      return runtimeArtifactOutput(await deps.artifacts.queries.get({ ...input, ...target }, context));
    },
  });

  const blocks = defineTool({
    name: 'bot_artifact_blocks',
    description: m.ui_tool_bot_artifact_blocks_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async () => runtimeArtifactOutput(deps.artifacts.queries.blocks()),
  });

  const create = defineTool({
    name: 'bot_artifact_create',
    description: m.ui_tool_bot_artifact_create_description(),
    parameters: artifactToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = artifactToolCreate.parse(params);
      const target = await runtimeArtifactTarget(api, context);
      return runtimeArtifactOutput(await deps.artifacts.actions.create({ ...input, ...target }, context));
    },
  });

  const update = defineTool({
    name: 'bot_artifact_update',
    description: m.ui_tool_bot_artifact_update_description(),
    parameters: artifactToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = artifactToolUpdate.parse(params);
      const target = await runtimeArtifactTarget(api, context);
      return runtimeArtifactOutput(await deps.artifacts.actions.update({ ...input, ...target }, context));
    },
  });

  return {
    extension: defineExtension({ name: 'bots.artifact-tools', tools: [list, get, blocks, create, update] }),
    readOnlyTools: [list, get, blocks],
  };
}

async function runtimeArtifactTarget(api: ToolExecutionApi, context: Context) {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  const botId = match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });

  return { botId, conversationId: api.conversationId };
}

function runtimeArtifactOutput(value: Artifact | ArtifactSummary[] | Record<string, unknown>) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
