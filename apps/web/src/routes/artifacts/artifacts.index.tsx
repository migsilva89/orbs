import { createFileRoute, redirect } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/artifacts/')({
  beforeLoad: async ({ context }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    const lists = await Promise.all(bots.map((bot) => context.queryClient.ensureQueryData(rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } }))));
    const latest = [...(lists.find((list) => list.length > 0) ?? [])].sort((left, right) => right.updatedAt - left.updatedAt).at(0);

    if (latest) {
      throw redirect({
        to: '/artifacts/$botId/$conversationId/$artifactId',
        params: { botId: latest.botId, conversationId: latest.conversationId, artifactId: latest.id },
        replace: true,
      });
    }
  },
});
