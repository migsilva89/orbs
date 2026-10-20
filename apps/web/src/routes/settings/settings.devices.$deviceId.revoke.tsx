import { createFileRoute, notFound } from '@tanstack/react-router';
import { SettingsDeviceRevokeDialog } from '@/components/settings/settings-device-revoke-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/settings/devices/$deviceId/revoke')({
  loader: async ({ context, params }) => {
    const devices = await context.queryClient.ensureQueryData(rpc.devices.list.queryOptions());
    const device = devices.find((item) => item.id === params.deviceId);

    if (!device || device.id === context.connection.deviceId) {
      throw notFound();
    }

    return { device };
  },
  component: SettingsDeviceRevokeRoute,
});

function SettingsDeviceRevokeRoute() {
  const { handleOpenChange } = useDialogNavigation({ to: '/settings' });

  return <SettingsDeviceRevokeDialog device={Route.useLoaderData().device} onOpenChange={handleOpenChange} />;
}
