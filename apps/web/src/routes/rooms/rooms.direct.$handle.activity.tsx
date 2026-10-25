import { createFileRoute } from '@tanstack/react-router';
import { RoomsActivity } from '@/components/rooms/rooms-activity';
import { roomsDirectBot } from '@/services/rooms/rooms.client';

export const Route = createFileRoute('/_chat/rooms/direct/$handle/activity')({
  loader: async ({ context, params }) => ({ botId: (await roomsDirectBot(context.queryClient, params)).id }),
  component: DirectActivityRoute,
});

function DirectActivityRoute() {
  const { botId } = Route.useLoaderData();

  return <RoomsActivity botId={botId} />;
}
