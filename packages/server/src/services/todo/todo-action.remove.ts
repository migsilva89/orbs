import type { TodoServiceDeps } from '../../types/todo.types';
import type { TodoTarget } from '@openbots/contracts/universal';

export async function todoActionRemove({ bots, runtime }: TodoServiceDeps, params: TodoTarget) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.removeTodo(params);
}
