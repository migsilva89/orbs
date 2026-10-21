import { createFileRoute } from '@tanstack/react-router';
import { RoomsPair } from '@/components/rooms/rooms-pair';
import { roomsDirectBot } from '@/services/rooms/rooms.client';

export const Route = createFileRoute('/_chat/rooms/direct/$handle/with/$peer/$conversationId')({
  loader: async ({ context, params }) => {
    const [sender, peer] = await Promise.all([
      roomsDirectBot(context.queryClient, params),
      roomsDirectBot(context.queryClient, { handle: params.peer }),
    ]);

    return { sender, peer, conversationId: Number(params.conversationId) };
  },
  component: DirectPairRoute,
});

function DirectPairRoute() {
  const { sender, peer, conversationId } = Route.useLoaderData();

  return (
    <RoomsPair
      conversationId={conversationId}
      key={`${peer.id}-${conversationId}`}
      peer={peer}
      sender={sender}
    />
  );
}
