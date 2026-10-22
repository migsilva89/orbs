import type { TodoServiceDeps } from '../../types/todo.types';
import type { TodoReorderInput } from '@repo/contracts/universal';

export async function todoActionReorder({ bots, runtime }: TodoServiceDeps, params: TodoReorderInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.actions.reorderTodos(params);
}
