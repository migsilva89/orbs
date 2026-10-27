import { chatResetSearch } from '@repo/contracts/universal';
import { RoomsResetDialog } from '@repo/ui/rooms/rooms-reset-dialog';
import { createFileRoute } from '@tanstack/react-router';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { roomsDirectBot } from '@/services/rooms/rooms.client';

export const Route = createFileRoute('/_chat/rooms/direct/$handle/reset')({
  validateSearch: chatResetSearch,
  loader: async ({ context, params }) => ({ bot: await roomsDirectBot(context.queryClient, params) }),
  component: DirectBotResetRoute,
});

function DirectBotResetRoute() {
  const { handle } = Route.useParams();
  const { handoff } = Route.useSearch();
  const { handleOpenChange } = useDialogNavigation({ to: '/rooms/direct/$handle', params: { handle } });

  return (
    <RoomsResetDialog
      bot={Route.useLoaderData().bot}
      handoff={handoff}
      onOpenChange={handleOpenChange}
    />
  );
}
