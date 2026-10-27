import { m } from '@repo/i18n/client';
import { LayoutNotFound } from '@repo/ui/layout/layout-error';
import { createFileRoute, useCanGoBack, useMatch, useRouter } from '@tanstack/react-router';
import { ArtifactList } from '@/components/artifacts/artifact-list';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/artifacts')({
  head: () => seoHead({ title: m.artifacts_title() }),
  loader: async ({ context }) => {
    const bots = await context.queryClient.ensureQueryData(rpc.bots.list.queryOptions());
    await Promise.all(bots.map((bot) => context.queryClient.ensureQueryData(rpc.artifacts.listBot.queryOptions({ input: { botId: bot.id } }))));

    return { breadcrumb: m.artifacts_title() };
  },
  component: ArtifactsRoute,
  notFoundComponent: LayoutNotFound,
});

function ArtifactsRoute() {
  const detail = useMatch({ from: '/_chat/artifacts/$botId/$conversationId/$artifactId', shouldThrow: false });
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <ArtifactList
      selected={detail?.params}
      onClose={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/rooms' }))}
    />
  );
}
