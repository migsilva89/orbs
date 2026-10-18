import { defineExtension, defineTool, StorageRequestError } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import * as m from '@openbots/i18n/messages';
import { match, P } from 'ts-pattern';
import {
  runtimeHistoryToolPage,
  runtimeHistoryToolPageParameters,
  runtimeHistoryToolSearch,
  runtimeHistoryToolSearchParameters,
} from '../../types/history.types';
import { runtimeReactTool, runtimeReactToolParameters } from '../../types/reaction.types';
import { runtimeHistoryOutput, runtimeHistoryPage } from './runtime-history.utils';
import { runtimeReactionSetBot } from './runtime-reaction.utils';
import type { Context } from '@earendil-works/chord/context';
import type { Cursor, ToolExecutionApi } from '@earendil-works/pi-durable';
import type { ConversationReaction } from '@openbots/contracts/universal';

export function runtimeChatToolsExtension() {
  const history = defineTool({
    name: 'bot_history',
    description: m.ui_tool_bot_history_description(),
    parameters: runtimeHistoryToolPageParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = runtimeHistoryToolPage.parse(params);
      return runtimeHistoryOutput(runtimeHistoryPage(await runtimeChatEntries(api, input.limit, input.cursor, context)));
    },
  });

  const search = defineTool({
    name: 'bot_search',
    description: m.ui_tool_bot_search_description(),
    parameters: runtimeHistoryToolSearchParameters,
    replay: 'safe',
    execute: async (params, api, context) => {
      const input = runtimeHistoryToolSearch.parse(params);
      return runtimeHistoryOutput(runtimeHistoryPage(await runtimeChatEntries(api, input.limit, input.cursor, context), input.query));
    },
  });

  const react = defineTool({
    name: 'bot_react',
    description: m.ui_tool_bot_react_description(),
    parameters: runtimeReactToolParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      return runtimeReactionOutput(await runtimeReactionSetBot(api, runtimeReactTool.parse(params), context));
    },
  });

  return {
    extension: defineExtension({ name: 'openbots.chat-tools', tools: [history, search, react] }),
    readOnlyTools: [history, search],
  };
}

async function runtimeChatEntries(api: ToolExecutionApi, limit: number | undefined, cursor: Cursor | undefined, context: Context) {
  try {
    return await api.commit((tx) => tx.scanEntries({
      conversationId: api.conversationId,
      order: 'descending',
    }, limit ?? 50, cursor), context);
  } catch (error) {
    throw match(error)
      .with(P.instanceOf(StorageRequestError), (cause) => new Errors.VALIDATION_ERROR({ fields: {}, cause }))
      .otherwise((cause) => cause);
  }
}

function runtimeReactionOutput(value: ConversationReaction) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
