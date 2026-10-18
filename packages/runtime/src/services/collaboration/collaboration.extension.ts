import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import * as m from '@openbots/i18n/messages';
import { collaborationActionSend } from './collaboration-action.send';
import { collaborationDelivery } from './collaboration-delivery.task';
import { COLLABORATION } from './collaboration.constants';
import { collaborationBotId } from './collaboration.utils';
import type { CollaborationDeps } from '../../types/collaboration.types';

export function collaborationExtension({ policy }: CollaborationDeps) {
  const deps = { policy, delivery: collaborationDelivery };

  const parameters = Type.Object({
    botId: Type.String({ minLength: 1, maxLength: 128 }),
    message: Type.String({ minLength: 1, maxLength: 64_000 }),
    context: Type.Optional(Type.Union([Type.Literal('existing'), Type.Literal('temporary')])),
  });

  const listBots = defineTool({
    name: 'bot_list',
    description: m.ui_tool_bot_list_description(),
    parameters: Type.Object({}),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const botId = await collaborationBotId(api, context);
      const bots = await policy.queries.bots({ botId });
      return { output: [{ type: 'text', text: JSON.stringify(bots) }] };
    },
  });

  const askBot = defineTool({
    name: 'bot_ask',
    description: m.ui_tool_bot_ask_description(),
    parameters,
    replay: 'safe',
    execute: (params, api, context) => collaborationActionSend(deps, { ...params, mode: 'ask' }, api, context),
  });

  const messageBot = defineTool({
    name: 'bot_message',
    description: m.ui_tool_bot_message_description(),
    parameters,
    replay: 'safe',
    execute: (params, api, context) => collaborationActionSend(deps, { ...params, mode: 'send' }, api, context),
  });

  return {
    extension: defineExtension({
      name: COLLABORATION.extension,
      tools: [listBots, askBot, messageBot],
      tasks: [collaborationDelivery],
    }),
    readOnlyTools: [listBots],
  };
}
