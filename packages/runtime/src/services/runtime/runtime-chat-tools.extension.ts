import { defineExtension, defineTool, section } from '@earendil-works/pi-durable';
import { REACTION } from '@repo/contracts/universal';
import * as m from '@repo/i18n/messages';
import {
  runtimeHistoryToolPage,
  runtimeHistoryToolPageParameters,
  runtimeHistoryToolSearch,
  runtimeHistoryToolSearchParameters,
} from '../../types/runtime-history.types';
import { runtimeReactionTool, runtimeReactionToolParameters } from '../../types/runtime-reaction.types';
import { runtimeHistoryEntries, runtimeHistoryOutput, runtimeHistoryPage } from './runtime-history.utils';
import { runtimeReactionSetBot } from './runtime-reaction.utils';
import { runtimeToolOutput } from './runtime-tool.utils';

export function runtimeChatToolsExtension() {
  const history = defineTool({
    name: 'bot_history',
    description: m.ui_tool_bot_history_description(),
    parameters: runtimeHistoryToolPageParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = runtimeHistoryToolPage.parse(params);
      return runtimeHistoryOutput(runtimeHistoryPage(await runtimeHistoryEntries(api, input.limit, input.cursor, context)));
    },
  });

  const search = defineTool({
    name: 'bot_search',
    description: m.ui_tool_bot_search_description(),
    parameters: runtimeHistoryToolSearchParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = runtimeHistoryToolSearch.parse(params);
      return runtimeHistoryOutput(runtimeHistoryPage(await runtimeHistoryEntries(api, input.limit, input.cursor, context), input.query));
    },
  });

  const react = defineTool({
    name: REACTION.toolName,
    description: m.ui_tool_bot_react_description(),
    parameters: runtimeReactionToolParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      return runtimeToolOutput(await runtimeReactionSetBot(api, runtimeReactionTool.parse(params), context));
    },
  });

  return {
    extension: defineExtension({
      name: 'bots.chat-tools',
      tools: [history, search, react],
      sections: [section('reactions', () => m.ui_tool_bot_react_prompt())],
    }),
    readOnlyTools: [history, search, react],
  };
}
