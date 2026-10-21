import { chatInitialViewOptions } from '@openbots/client/react';
import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router';
import { RoomsPage } from '@/components/rooms/rooms-page';
import { roomsDirectBot } from '@/services/rooms/rooms.client';
import { RPC_CONTEXT } from '@/services/rpc/rpc.constants';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/rooms/direct/$handle')({
  loader: async ({ context, params }) => {
    const bot = await roomsDirectBot(context.queryClient, params);
    await context.queryClient.ensureQueryData(chatInitialViewOptions(RPC_CONTEXT, { botId: bot.id }));

    return { botId: bot.id, title: bot.name };
  },
  head: ({ loaderData }) => seoHead({ title: loaderData?.title }),
  component: DirectRoomRoute,
});

function DirectRoomRoute() {
  const { botId } = Route.useLoaderData();
  const pair = useMatch({ from: '/_chat/rooms/direct/$handle/with/$peer/$conversationId', shouldThrow: false });

  return (
    <>
      {pair ? null : <RoomsPage botId={botId} />}
      <Outlet />
    </>
  );
}
