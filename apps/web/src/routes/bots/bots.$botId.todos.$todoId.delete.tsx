import { createFileRoute, notFound } from '@tanstack/react-router';
import { TodosDeleteDialog } from '@/components/todos/todos-delete-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';
import { todosFind } from '@/services/todos/todos.client';

export const Route = createFileRoute('/_chat/bots/$botId/todos/$todoId/delete')({
  loader: async ({ context, params }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    const bot = bots.find((item) => item.id === params.botId);

    if (!bot) {
      throw notFound();
    }

    return { bot, todo: await todosFind(context.queryClient, { botId: bot.id, todoId: params.todoId }) };
  },
  component: BotTodoDeleteRoute,
});

function BotTodoDeleteRoute() {
  const { bot, todo } = Route.useLoaderData();
  const { handleOpenChange } = useDialogNavigation({ to: '/bots/$botId', params: { botId: bot.id } });

  return (
    <TodosDeleteDialog
      bot={bot}
      todo={todo}
      onOpenChange={handleOpenChange}
    />
  );
}
