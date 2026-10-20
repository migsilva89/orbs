import type { TodoServiceDeps } from '../../types/todo.types';
import type { TodoCreateInput } from '@openbots/contracts/universal';

export async function todoActionCreate({ bots, runtime }: TodoServiceDeps, params: TodoCreateInput) {
  await bots.actions.configure({ botId: params.botId });
  return runtime.actions.createTodo(params);
}
