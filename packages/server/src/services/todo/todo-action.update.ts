import type { TodoServiceDeps } from '../../types/todo.types';
import type { TodoUpdateInput } from '@openbots/contracts/universal';

export async function todoActionUpdate({ bots, runtime }: TodoServiceDeps, params: TodoUpdateInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.updateTodo(params);
}
