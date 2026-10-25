import { useChatListSync } from '@repo/client/react';
import { chatSearch } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { createFileRoute, Outlet, redirect, useMatch } from '@tanstack/react-router';
import { LayoutShellDashboard } from '@/components/layout/layout-shell-dashboard';
import { RoomsDetails } from '@/components/rooms/rooms-details';
import { RoomsSearch } from '@/components/rooms/rooms-search';
import { RoomsSectionDeleteDialog } from '@/components/rooms/rooms-section-delete-dialog';
import { RoomsSectionDialog } from '@/components/rooms/rooms-section-dialog';
import { useLayoutShortcuts } from '@/hooks/use-layout-shortcuts';
import { useRoomsNotify } from '@/hooks/use-rooms-notify';
import { useRoomsPresence } from '@/hooks/use-rooms-presence';
import { layoutSidebarsOpen } from '@/services/layout/layout.client';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat')({
  head: () => seoHead({ title: m.rooms_meta_title() }),
  validateSearch: chatSearch,
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
      context.queryClient.ensureQueryData(rpc.models.list.queryOptions()),
    ]);

    return { sidebars, connection: context.connection };
  },
  component: RoomsLayout,
});

function RoomsLayout() {
  useChatListSync();
  useRoomsNotify();
  useRoomsPresence();
  useLayoutShortcuts();
  const { sidebars, connection } = Route.useLoaderData();
  const room = useMatch({ from: '/_chat/rooms/direct/$handle', shouldThrow: false });

  return (
    <LayoutShellDashboard
      aside={<RoomsDetails />}
      asidePathname={room?.pathname}
      connection={connection}
      sidebars={sidebars}
    >
      <Outlet />
      <RoomsSearch />
      <RoomsSectionDialog />
      <RoomsSectionDeleteDialog />
    </LayoutShellDashboard>
  );
}
