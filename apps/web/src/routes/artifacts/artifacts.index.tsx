import { m } from '@repo/i18n/client';
import { createFileRoute } from '@tanstack/react-router';
import { ArtifactList } from '@/components/artifacts/artifact-list';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/artifacts/')({
  loader: async ({ context }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    await Promise.all(bots.map((bot) => context.queryClient.ensureQueryData(rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } }))));
  },
  head: () => seoHead({ title: m.artifacts_title() }),
  component: ArtifactList,
});
