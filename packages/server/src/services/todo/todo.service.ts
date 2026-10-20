import { todoActionCreate } from './todo-action.create';
import { todoActionRemove } from './todo-action.remove';
import { todoActionReorder } from './todo-action.reorder';
import { todoActionUpdate } from './todo-action.update';
import { todoQueryList } from './todo-query.list';
import type { TodoServiceDeps } from '../../types/todo.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function makeTodoService(deps: TodoServiceDeps) {
  return {
    actions: {
      create: (params: UniversalTypes.TodoCreateInput) => todoActionCreate(deps, params),
      update: (params: UniversalTypes.TodoUpdateInput) => todoActionUpdate(deps, params),
      reorder: (params: UniversalTypes.TodoReorderInput) => todoActionReorder(deps, params),
      remove: (params: UniversalTypes.TodoTarget) => todoActionRemove(deps, params),
    },
    queries: {
      list: (params: UniversalTypes.BotGetInput) => todoQueryList(deps, params),
    },
  };
}

export type TodoService = ReturnType<typeof makeTodoService>;
