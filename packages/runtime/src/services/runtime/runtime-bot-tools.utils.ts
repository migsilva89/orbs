import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { botCreate } from '@openbots/contracts/universal';
import * as m from '@openbots/i18n/messages';
import {
  botToolCreate,
  botToolCreateParameters,
  botToolGet,
  botToolGetParameters,
  botToolSwapModels,
  botToolSwapModelsParameters,
  botToolUpdate,
  botToolUpdateParameters,
} from '../../types/runtime-bot-tools.types';
import { runtimeQueryModels } from './runtime-query.models';
import type { RuntimeBotToolsDeps } from '../../types/runtime-bot-tools.types';
import type { Bot, BotCatalog, BotSwapModelsResult } from '@openbots/contracts/universal';

export function runtimeBotToolsExtension(deps: RuntimeBotToolsDeps) {
  const get = defineTool({
    name: 'bot_get',
    description: m.ui_tool_bot_get_description(),
    parameters: botToolGetParameters,
    replay: 'safe',
    execute: async (params) => {
      const input = botToolGet.parse(params);
      return runtimeBotToolsOutput(await deps.bots.queries.get(input));
    },
  });

  const create = defineTool({
    name: 'bot_create',
    description: m.ui_tool_bot_create_description(),
    parameters: botToolCreateParameters,
    replay: 'unsafe',
    execute: async (params) => {
      const input = botCreate.parse(botToolCreate.parse(params));
      return runtimeBotToolsOutput(await deps.bots.actions.create(input));
    },
  });

  const update = defineTool({
    name: 'bot_update',
    description: m.ui_tool_bot_update_description(),
    parameters: botToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params) => {
      const input = botToolUpdate.parse(params);
      return runtimeBotToolsOutput(await deps.bots.actions.update(input));
    },
  });

  const swapModels = defineTool({
    name: 'bot_swap_models',
    description: m.ui_tool_bot_swap_models_description(),
    parameters: botToolSwapModelsParameters,
    replay: 'unsafe',
    execute: async (params) => {
      const input = botToolSwapModels.parse(params);
      return runtimeBotToolsOutput(await deps.bots.actions.swapModels(input));
    },
  });

  const catalog = defineTool({
    name: 'bot_catalog',
    description: m.ui_tool_bot_catalog_description(),
    parameters: botToolGetParameters,
    replay: 'safe',
    execute: async (params) => {
      const input = botToolGet.parse(params);
      return runtimeBotToolsOutput(await deps.bots.queries.catalog(input));
    },
  });

  const models = defineTool({
    name: 'bot_model_list',
    description: m.ui_tool_bot_model_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async () => runtimeBotToolsOutput(await runtimeQueryModels(deps)),
  });

  return {
    extension: defineExtension({
      name: 'openbots.bot-tools',
      tools: [get, create, update, swapModels, catalog, models],
    }),
    readOnlyTools: [get, catalog, models],
  };
}

function runtimeBotToolsOutput(value: Bot | BotCatalog | BotSwapModelsResult | Awaited<ReturnType<typeof runtimeQueryModels>>) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
