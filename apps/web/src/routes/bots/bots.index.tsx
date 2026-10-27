import { createFileRoute, redirect } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/bots/')({
  beforeLoad: async ({ context }) => {
    const bot = (await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions())).at(0);

    throw bot
      ? redirect({
        to: '/bots/$botId/$tab',
        params: { botId: bot.id, tab: 'profile' },
        replace: true,
      })
      : redirect({ to: '/bots/create', replace: true });
  },
});
