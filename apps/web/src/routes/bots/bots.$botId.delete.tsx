import { BotDeleteDialog } from '@repo/ui/bots/bot-delete-dialog';
import { createFileRoute, notFound, useNavigate } from '@tanstack/react-router';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/bots/$botId/delete')({
  loader: async ({ context, params }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    const bot = bots.find((item) => item.id === params.botId);

    if (!bot) {
      throw notFound();
    }

    return { bot };
  },
  component: BotDeleteRoute,
});

function BotDeleteRoute() {
  const { bot } = Route.useLoaderData();
  const navigate = useNavigate();
  const { handleOpenChange } = useDialogNavigation({ to: '/bots/$botId', params: { botId: bot.id } });

  return (
    <BotDeleteDialog
      bot={bot}
      onDeleted={() => navigate({ to: '/bots' })}
      onOpenChange={handleOpenChange}
    />
  );
}
