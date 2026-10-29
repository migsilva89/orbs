import { createFileRoute, notFound } from '@tanstack/react-router';
import { rpc } from '@/services/rpc/rpc.client';

export const Route = createFileRoute('/_chat/settings/devices/$deviceId/revoke')({
  loader: async ({ context, params }) => {
    const devices = await context.queryClient.ensureQueryData(rpc.devices.list.queryOptions());

    if (!devices.some((item) => item.id === params.deviceId) || params.deviceId === context.connection.deviceId) {
      throw notFound();
    }
  },
});
