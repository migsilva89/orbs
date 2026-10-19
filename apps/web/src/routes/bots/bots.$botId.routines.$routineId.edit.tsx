import { createFileRoute, notFound } from '@tanstack/react-router';
import { RoutinesEditDialog } from '@/components/routines/routines-edit-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/bots/$botId/routines/$routineId/edit')({
  loader: async ({ context, params }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    const bot = bots.find((item) => item.id === params.botId);
    const routines = bot ? await context.queryClient.ensureQueryData(rpc.routines.list.queryOptions({ input: { botId: bot.id } })) : [];
    const routine = routines.find((item) => item.id === params.routineId);

    if (!bot || !routine) {
      throw notFound();
    }

    return { bot, routine };
  },
  component: BotRoutineEditRoute,
});

function BotRoutineEditRoute() {
  const { bot, routine } = Route.useLoaderData();
  const { handleOpenChange } = useDialogNavigation({ to: '/bots/$botId', params: { botId: bot.id } });

  return (
    <RoutinesEditDialog
      bot={bot}
      routine={routine}
      onOpenChange={handleOpenChange}
    />
  );
}
