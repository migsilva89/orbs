import { m } from '@repo/i18n/client';
import { LayoutNotFound } from '@repo/ui/layout/layout-error';
import { createFileRoute, useMatch } from '@tanstack/react-router';
import { ArtifactList } from '@/components/artifacts/artifact-list';
import { useSectionDialogClose } from '@/hooks/use-section-dialog-close';
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
  const close = useSectionDialogClose();

  return (
    <ArtifactList
      selected={detail?.params}
      onClose={close}
    />
  );
}
