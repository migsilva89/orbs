import { defineDoc } from '@earendil-works/pi-durable';
import type { TodoDocument } from '../../types/todo.types';

export const todoDocument = defineDoc<TodoDocument>({
  kind: 'bots.todos',
  version: 1,
  scope: 'conversation',
  history: 'latest',
  fork: 'initial',
  initial: () => ({ nextId: 1, todos: [] }),
  checkpointWhen: () => false,
});

/** Open todos shown in the system prompt; the rest stay reachable through `bot_todo_list`. */
export const TODO_PROMPT_LIMIT = 20;
