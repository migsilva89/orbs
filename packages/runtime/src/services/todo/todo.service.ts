import { defineExtension, section } from '@earendil-works/pi-durable';
import * as m from '@openbots/i18n/messages';
import { match } from 'ts-pattern';
import { todoActionCreate } from './todo-action.create';
import { todoActionRemove } from './todo-action.remove';
import { todoActionReorder } from './todo-action.reorder';
import { todoActionUpdate } from './todo-action.update';
import { todoQueryList } from './todo-query.list';
import { TODO_PROMPT_LIMIT, todoDocument } from './todo.constants';
import type * as TodoTypes from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';

/**
 * Shows the open todos in the system prompt. Pi resends a section only when its text changes, so an unchanged list
 * keeps the prompt cache warm, and an empty list omits the section.
 */
export const todoExtension = defineExtension({
  name: 'openbots.todos',
  sections: [section('todos', async (input, context) => {
    const doc = await input.read.snapshot(todoDocument, input.conversationId, context);
    const open = (doc?.todos ?? []).filter((todo) => !todo.isDone);

    const lines = open.slice(0, TODO_PROMPT_LIMIT).map((todo) => `#${todo.id} ${todo.title}`);
    const hidden = open.length - lines.length;

    return match({ lines, hidden })
      .with({ lines: [] }, () => undefined)
      .with({ hidden: 0 }, () => [m.ui_todo_prompt(), ...lines].join('\n'))
      .otherwise(() => [m.ui_todo_prompt(), ...lines, m.ui_todo_prompt_more({ count: hidden })].join('\n'));
  })],
});

export function makeTodoService(deps: TodoTypes.TodoServiceDeps) {
  return {
    actions: {
      create: (params: TodoTypes.TodoCreateParams, context: Context) => todoActionCreate(deps, params, context),
      update: (params: TodoTypes.TodoUpdateParams, context: Context) => todoActionUpdate(deps, params, context),
      reorder: (params: TodoTypes.TodoReorderParams, context: Context) => todoActionReorder(deps, params, context),
      remove: (params: TodoTypes.TodoTargetParams, context: Context) => todoActionRemove(deps, params, context),
    },
    queries: {
      list: (params: TodoTypes.TodoConversationParams, context: Context) => todoQueryList(deps, params, context),
    },
  };
}

export type TodoService = ReturnType<typeof makeTodoService>;
