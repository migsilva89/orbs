import { notFound } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import type { TodosFindParams } from '@/types/todos.types';
import type { QueryClient } from '@tanstack/react-query';

export async function todosFind(queryClient: QueryClient, { botId, todoId }: TodosFindParams) {
  const todos = await queryClient.ensureQueryData(rpc.todos.list.queryOptions({ input: { botId } }));
  const todo = todos.find((item) => String(item.id) === todoId);

  if (!todo) {
    throw notFound();
  }

  return todo;
}
