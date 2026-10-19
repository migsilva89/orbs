import { chatSearch } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { LayoutShellDashboard } from '@/components/layout/layout-shell-dashboard';
import { RoomsDetails } from '@/components/rooms/rooms-details';
import { RoomsSearch } from '@/components/rooms/rooms-search';
import { useLayoutShortcuts } from '@/hooks/use-layout-shortcuts';
import { useRoomsNotify } from '@/hooks/use-rooms-notify';
import { useRoomsSync } from '@/hooks/use-rooms-sync';
import { connectionRead } from '@/services/connection/connection.client';
import { layoutSidebarsOpen } from '@/services/layout/layout.client';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat')({
  head: () => seoHead({ title: m.rooms_meta_title() }),
  validateSearch: chatSearch,
  beforeLoad: () => {
    if (!connectionRead()) {
      throw redirect({ to: '/connect' });
    }
  },
  loader: async ({ context }) => {
    const [sidebars] = await Promise.all([
      layoutSidebarsOpen(),
      context.queryClient.ensureQueryData(rpc.conversation.list.queryOptions()),
      context.queryClient.ensureQueryData(rpc.bots.list.queryOptions()),
    ]);

    return { sidebars };
  },
  component: RoomsLayout,
});

function RoomsLayout() {
  useRoomsSync();
  useRoomsNotify();
  useLayoutShortcuts();
  const { sidebars } = Route.useLoaderData();

  return (
    <LayoutShellDashboard aside={<RoomsDetails />} sidebars={sidebars}>
      <Outlet />
      <RoomsSearch />
    </LayoutShellDashboard>
  );
}
