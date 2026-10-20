import type { TodoServiceDeps } from '../../types/todo.types';
import type { BotGetInput } from '@openbots/contracts/universal';

export async function todoQueryList({ bots, runtime }: TodoServiceDeps, params: BotGetInput) {
  await bots.queries.get({ botId: params.botId });
  return runtime.queries.todos(params);
}
