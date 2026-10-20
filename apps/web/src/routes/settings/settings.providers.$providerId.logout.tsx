import { createFileRoute, notFound } from '@tanstack/react-router';
import { SettingsProviderLogoutDialog } from '@/components/settings/settings-provider-logout-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/settings/providers/$providerId/logout')({
  loader: async ({ context, params }) => {
    const { providers } = await context.queryClient.ensureQueryData(rpc.providers.list.queryOptions());
    const provider = providers.find((item) => item.id === params.providerId);

    if (!provider?.isConfigured || provider.source !== 'stored') {
      throw notFound();
    }

    return { provider };
  },
  component: SettingsProviderLogoutRoute,
});

function SettingsProviderLogoutRoute() {
  const { handleOpenChange } = useDialogNavigation({ to: '/settings' });

  return <SettingsProviderLogoutDialog provider={Route.useLoaderData().provider} onOpenChange={handleOpenChange} />;
}
