import { botDefaultSettings } from '@openbots/client/client';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { BotCreateDialog } from '@/components/bots/bot-create-dialog';
import { BotList } from '@/components/bots/bot-list';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/bots/create')({
  loader: async ({ context }) => {
    const models = await context.queryClient.ensureQueryData(rpc.models.list.queryOptions()).catch(() => null);

    return { settings: models ? botDefaultSettings({ models, thinkingLevel: 'medium' }) : null };
  },
  component: BotCreateRoute,
});

function BotCreateRoute() {
  const { settings } = Route.useLoaderData();
  const navigate = useNavigate();
  const { handleOpenChange } = useDialogNavigation({ to: '/bots' });

  return (
    <>
      <BotList />
      <BotCreateDialog
        settings={settings}
        onCreated={(bot) => void navigate({ to: '/bots/$botId', params: { botId: bot.id } })}
        onOpenChange={handleOpenChange}
      />
    </>
  );
}
