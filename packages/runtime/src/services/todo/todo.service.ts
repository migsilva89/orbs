import { todoActionCreate } from './todo-action.create';
import { todoActionRemove } from './todo-action.remove';
import { todoActionReorder } from './todo-action.reorder';
import { todoActionUpdate } from './todo-action.update';
import { todoQueryList } from './todo-query.list';
import type * as TodoTypes from '../../types/todo.types';
import type { Context } from '@earendil-works/chord/context';

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
