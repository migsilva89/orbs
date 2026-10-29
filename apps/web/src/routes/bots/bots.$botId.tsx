import { createFileRoute, notFound } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/bots/$botId')({
  loader: async ({ context, params }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    const bot = bots.find((item) => item.id === params.botId);

    if (!bot) {
      throw notFound();
    }

    return { breadcrumb: bot.name };
  },
  head: ({ loaderData }) => seoHead({ title: loaderData?.breadcrumb }),
});
