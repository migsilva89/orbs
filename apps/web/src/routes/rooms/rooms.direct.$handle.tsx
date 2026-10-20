import { createFileRoute, Outlet } from '@tanstack/react-router';
import { RoomsPage } from '@/components/rooms/rooms-page';
import { chatInitialViewOptions } from '@/services/chat/chat.client';
import { roomsDirectBot } from '@/services/rooms/rooms.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/rooms/direct/$handle')({
  loader: async ({ context, params }) => {
    const bot = await roomsDirectBot(context.queryClient, params);
    await context.queryClient.ensureQueryData(chatInitialViewOptions({ botId: bot.id }));

    return { botId: bot.id, title: bot.name };
  },
  head: ({ loaderData }) => seoHead({ title: loaderData?.title }),
  component: DirectRoomRoute,
});

function DirectRoomRoute() {
  return (
    <>
      <RoomsPage botId={Route.useLoaderData().botId} />
      <Outlet />
    </>
  );
}
