import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { NotificationPlatform } from '@openbots/contracts/universal';

/** Where notifications go when no device is in use: the phone or an open computer. */
export function useNotificationSettings() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const settings = useQuery(rpc.notifications.settings.queryOptions());

  const configure = useMutation(rpc.notifications.configure.mutationOptions({
    meta: { error: m.settings_save_failed() },
    onSuccess: (saved) => queryClient.setQueryData(rpc.notifications.settings.queryKey(), saved),
  }));

  return {
    prefer: settings.data?.prefer,
    isPending: configure.isPending,
    setPrefer: (prefer: NotificationPlatform) => configure.mutate({ prefer }),
  };
}
