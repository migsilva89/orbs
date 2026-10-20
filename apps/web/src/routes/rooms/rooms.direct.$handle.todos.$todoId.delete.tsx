import { createFileRoute } from '@tanstack/react-router';
import { TodosDeleteDialog } from '@/components/todos/todos-delete-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { roomsDirectBot } from '@/services/rooms/rooms.client';
import { todosFind } from '@/services/todos/todos.client';

export const Route = createFileRoute('/_chat/rooms/direct/$handle/todos/$todoId/delete')({
  loader: async ({ context, params }) => {
    const bot = await roomsDirectBot(context.queryClient, params);
    return { bot, todo: await todosFind(context.queryClient, { botId: bot.id, todoId: params.todoId }) };
  },
  component: DirectBotTodoDeleteRoute,
});

function DirectBotTodoDeleteRoute() {
  const { handle } = Route.useParams();
  const { bot, todo } = Route.useLoaderData();
  const { handleOpenChange } = useDialogNavigation({ to: '/rooms/direct/$handle', params: { handle } });

  return (
    <TodosDeleteDialog
      bot={bot}
      todo={todo}
      onOpenChange={handleOpenChange}
    />
  );
}
