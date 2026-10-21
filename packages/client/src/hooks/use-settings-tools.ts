import { m } from '@openbots/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { SettingsDoneParams } from '../types/settings.types';
import type { ToolSettingsForm } from '@openbots/contracts/universal';

/** Tool approval rules, the approval timeout and the JEV key; an empty key keeps the saved one. */
export function useSettingsTools({ onDone }: SettingsDoneParams) {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const settings = useQuery(rpc.tools.settings.queryOptions());

  const save = useMutation(rpc.tools.configure.mutationOptions({
    meta: { success: m.settings_saved() },
    onSuccess: (saved) => {
      queryClient.setQueryData(rpc.tools.settings.queryKey(), saved);
      onDone();
    },
  }));

  return {
    settings,
    isPending: save.isPending,
    problem: save.isError ? m.settings_save_error() : null,
    save: ({ jevApiKey, ...form }: ToolSettingsForm) => save.mutate({ ...form, jevApiKey: jevApiKey || undefined }),
  };
}
