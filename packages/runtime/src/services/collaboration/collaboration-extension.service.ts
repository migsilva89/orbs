import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import * as m from '@repo/i18n/messages';
import { collaborationActionNotify } from './collaboration-action.notify';
import { collaborationActionSend } from './collaboration-action.send';
import { collaborationDeliveryTask } from './collaboration-delivery.task';
import { COLLABORATION } from './collaboration.constants';
import { collaborationBotId } from './collaboration.utils';
import type { CollaborationDeps } from '../../types/collaboration.types';

export function makeCollaborationExtensionService({ policy, directory }: CollaborationDeps) {
  const delivery = collaborationDeliveryTask({ directory });
  const deps = { policy, directory, delivery };

  const parameters = Type.Object({
    botId: Type.String({ minLength: 1, maxLength: 128 }),
    message: Type.String({ minLength: 1, maxLength: 64_000 }),
    context: Type.Optional(Type.Union([Type.Literal('existing'), Type.Literal('private')])),
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
    execute: (params, api, context) => collaborationActionSend(deps, {
      input: { ...params, mode: 'ask' },
      api,
      context,
    }),
  });

  const messageBot = defineTool({
    name: 'bot_message',
    description: m.ui_tool_bot_message_description(),
    parameters,
    replay: 'safe',
    execute: (params, api, context) => collaborationActionSend(deps, {
      input: { ...params, mode: 'send' },
      api,
      context,
    }),
  });

  const notifyOwner = defineTool({
    name: 'bot_notify_owner',
    description: m.ui_tool_bot_notify_owner_description(),
    parameters: Type.Object({ message: Type.String({ minLength: 1, maxLength: 8000 }) }),
    replay: 'safe',
    execute: (params, api, context) => collaborationActionNotify(deps, {
      input: params,
      api,
      context,
    }),
  });

  return {
    extension: defineExtension({
      name: COLLABORATION.extension,
      tools: [listBots, askBot, messageBot, notifyOwner],
      tasks: [delivery],
    }),
    readOnlyTools: [listBots],
  };
}

export type CollaborationExtensionService = ReturnType<typeof makeCollaborationExtensionService>;
