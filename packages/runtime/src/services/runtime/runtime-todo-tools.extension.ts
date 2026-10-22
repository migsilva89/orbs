import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { Errors } from '@openbots/errors/universal';
import * as m from '@openbots/i18n/messages';
import { match, P } from 'ts-pattern';
import {
  todoToolCreate,
  todoToolCreateParameters,
  todoToolTarget,
  todoToolTargetParameters,
  todoToolUpdate,
  todoToolUpdateParameters,
} from '../../types/runtime-todo.types';
import { runtimeQueryConversation } from './runtime-query.conversation';
import { runtimeBot } from './runtime.constants';
import type { RuntimeTodoToolsDeps } from '../../types/runtime-todo.types';
import type { Context } from '@earendil-works/chord/context';
import type { ToolExecutionApi } from '@earendil-works/pi-durable';
import type { Todo } from '@openbots/contracts/universal';

export function runtimeTodoToolsExtension(deps: RuntimeTodoToolsDeps) {
  const list = defineTool({
    name: 'bot_todo_list',
    description: m.ui_tool_bot_todo_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const target = await runtimeTodoTarget(deps, api, context);
      return runtimeTodoOutput(await deps.todos.queries.list(target, context));
    },
  });

  const create = defineTool({
    name: 'bot_todo_create',
    description: m.ui_tool_bot_todo_create_description(),
    parameters: todoToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolCreate.parse(params);
      const target = await runtimeTodoTarget(deps, api, context);
      return runtimeTodoOutput(await deps.todos.actions.create({ ...input, ...target }, context));
    },
  });

  const update = defineTool({
    name: 'bot_todo_update',
    description: m.ui_tool_bot_todo_update_description(),
    parameters: todoToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolUpdate.parse(params);
      const target = await runtimeTodoTarget(deps, api, context);
      return runtimeTodoOutput(await deps.todos.actions.update({ ...input, ...target }, context));
    },
  });

  const remove = defineTool({
    name: 'bot_todo_remove',
    description: m.ui_tool_bot_todo_remove_description(),
    parameters: todoToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolTarget.parse(params);
      const target = await runtimeTodoTarget(deps, api, context);
      await deps.todos.actions.remove({ ...input, ...target }, context);

      return { output: [{ type: 'text', text: m.ui_tool_bot_todo_removed() }] };
    },
  });

  return {
    extension: defineExtension({ name: 'openbots.todo-tools', tools: [list, create, update, remove] }),
    readOnlyTools: [list],
  };
}

/** Todos belong to the bot's main chat, including when a private context or subagent edits them. */
async function runtimeTodoTarget(deps: RuntimeTodoToolsDeps, api: ToolExecutionApi, context: Context) {
  const identity = await api.snapshot(runtimeBot, api.conversationId, context);

  const botId = match(identity?.botId)
    .with(P.string, (id) => id)
    .otherwise(() => {
      throw new Errors.FORBIDDEN();
    });

  const conversation = await runtimeQueryConversation(deps, { botId }, context);
  return { conversationId: conversation.id };
}

function runtimeTodoOutput(value: Todo | Todo[]) {
  return { output: [{ type: 'text' as const, text: JSON.stringify(value) }] };
}
