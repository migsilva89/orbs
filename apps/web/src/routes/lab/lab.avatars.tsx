import { m } from '@repo/i18n/client';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AvatarStudio } from '@/components/avatars/avatar-studio';
import { LayoutShellDashboard } from '@/components/layout/layout-shell-dashboard';
import { layoutSidebarsOpen } from '@/services/layout/layout.client';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/lab/avatars')({
  head: () => seoHead({ title: m.avatars_meta_title() }),
  beforeLoad: ({ context }) => {
    if (!context.connection) {
      throw redirect({ to: '/connect' });
    }

    return { connection: context.connection };
  },
  loader: async ({ context }) => {
    const [sidebars] = await Promise.all([
      layoutSidebarsOpen(),
      context.queryClient.ensureQueryData(rpc.conversation.list.queryOptions()),
      context.queryClient.ensureQueryData(rpc.bots.list.queryOptions()),
    ]);

    return { breadcrumb: m.avatars_breadcrumb(), connection: context.connection, sidebars };
  },
  component: LabAvatarsRoute,
});

function LabAvatarsRoute() {
  const { connection, sidebars } = Route.useLoaderData();

  return (
    <LayoutShellDashboard connection={connection} sidebars={sidebars}>
      <AvatarStudio />
    </LayoutShellDashboard>
  );
}
