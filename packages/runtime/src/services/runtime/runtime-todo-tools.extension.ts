import { Type } from '@earendil-works/pi-ai';
import { defineExtension, defineTool } from '@earendil-works/pi-durable';
import { Errors } from '@repo/errors/universal';
import * as m from '@repo/i18n/messages';
import { match, P } from 'ts-pattern';
import {
  todoToolCreate,
  todoToolCreateParameters,
  todoToolTarget,
  todoToolTargetParameters,
  todoToolUpdate,
  todoToolUpdateParameters,
} from '../../types/todo-tool.types';
import { runtimeToolBotTarget, runtimeToolOutput } from './runtime-tool.utils';
import type { TodoToolDeps } from '../../types/todo-tool.types';

export function runtimeTodoToolsExtension(deps: TodoToolDeps) {
  const list = defineTool({
    name: 'bot_todo_list',
    description: m.ui_tool_bot_todo_list_description(),
    parameters: Type.Object({}, { additionalProperties: false }),
    replay: 'safe',
    execute: async (_params, api, context) => {
      const { conversationId } = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.todos.queries.list({ conversationId }, context));
    },
  });

  const create = defineTool({
    name: 'bot_todo_create',
    description: m.ui_tool_bot_todo_create_description(),
    parameters: todoToolCreateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolCreate.parse(params);
      const { conversationId } = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.todos.actions.create({ ...input, conversationId }, context));
    },
  });

  const update = defineTool({
    name: 'bot_todo_update',
    description: m.ui_tool_bot_todo_update_description(),
    parameters: todoToolUpdateParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolUpdate.parse(params);
      const { conversationId } = await runtimeToolBotTarget(deps, api, context);
      return runtimeToolOutput(await deps.todos.actions.update({ ...input, conversationId }, context));
    },
  });

  const remove = defineTool({
    name: 'bot_todo_remove',
    description: m.ui_tool_bot_todo_remove_description(),
    parameters: todoToolTargetParameters,
    replay: 'unsafe',
    execute: async (params, api, context) => {
      const input = todoToolTarget.parse(params);
      const { conversationId } = await runtimeToolBotTarget(deps, api, context);

      const removed = match((await deps.todos.queries.list({ conversationId }, context)).find((todo) => todo.id === input.todoId))
        .with(P.nonNullable, (todo) => todo)
        .otherwise(() => {
          throw new Errors.NOT_FOUND({ resource: 'todo', resourceId: input.todoId });
        });

      await deps.todos.actions.remove({ ...input, conversationId }, context);

      return runtimeToolOutput(removed);
    },
  });

  return {
    extension: defineExtension({ name: 'bots.todo-tools', tools: [list, create, update, remove] }),
    readOnlyTools: [list],
  };
}
