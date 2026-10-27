import { m } from '@repo/i18n/client';
import { LayoutNotFound } from '@repo/ui/layout/layout-error';
import { createFileRoute, Outlet } from '@tanstack/react-router';
import { SettingsPage } from '@/components/settings/settings-page';
import { rpc } from '@/services/rpc/rpc.client';
import { seoHead } from '@/services/seo/seo.utils';

export const Route = createFileRoute('/_chat/settings')({
  head: () => seoHead({ title: m.settings_title() }),
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(rpc.providers.list.queryOptions()),
      context.queryClient.ensureQueryData(rpc.tools.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.conversation.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.skills.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.instructions.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.plugins.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.mcp.settings.queryOptions()),
      context.queryClient.ensureQueryData(rpc.devices.list.queryOptions()),
    ]);

    return { breadcrumb: m.settings_title(), connection: context.connection };
  },
  component: SettingsLayout,
  notFoundComponent: LayoutNotFound,
});

function SettingsLayout() {
  const { connection } = Route.useLoaderData();

  return (
    <>
      <SettingsPage connection={connection} />
      <Outlet />
    </>
  );
}
