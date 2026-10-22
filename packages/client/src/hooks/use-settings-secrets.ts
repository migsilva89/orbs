import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SETTINGS } from '../services/settings/settings.constants';
import { useRpc } from './use-rpc';
import type { SecretMode } from '@openbots/contracts/universal';

/** Stored secret names and hosts, never values, and how bash commands get them. */
export function useSettingsSecrets() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const list = useQuery(rpc.secrets.list.queryOptions());
  const settings = useQuery(rpc.secrets.settings.queryOptions());
  const remove = useMutation(rpc.secrets.remove.mutationOptions({ meta: { invalidates: [rpc.secrets.list.key()] } }));

  const configure = useMutation(rpc.secrets.configure.mutationOptions({
    meta: { success: m.settings_saved() },
    onSuccess: (saved) => queryClient.setQueryData(rpc.secrets.settings.queryKey(), saved),
  }));

  return {
    secrets: list.data ?? [],
    mode: settings.data?.mode,
    varlockInstallUrl: settings.data?.mode === 'varlock' ? SETTINGS.varlockInstallUrl : null,
    isPending: remove.isPending || configure.isPending,
    remove: (name: string) => remove.mutate({ name }),
    configure: (mode: SecretMode) => configure.mutate({ mode }),
  };
}
