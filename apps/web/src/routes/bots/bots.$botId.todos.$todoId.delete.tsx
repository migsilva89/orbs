import { createFileRoute } from '@tanstack/react-router';
import { todosFind } from '@/services/todos/todos.client';

export const Route = createFileRoute('/_chat/bots/$botId/todos/$todoId/delete')({
  loader: async ({ context, params }) => {
    await todosFind(context.queryClient, { botId: params.botId, todoId: params.todoId });
  },
});
