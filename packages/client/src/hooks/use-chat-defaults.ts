import { m } from '@repo/i18n/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { ConversationConfigureInput } from '@repo/contracts/universal';

export function useChatDefaults() {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const settings = useQuery(rpc.conversation.settings.queryOptions());

  const configure = useMutation(rpc.conversation.configure.mutationOptions({
    meta: { error: m.settings_save_failed() },
    onSuccess: (saved) => queryClient.setQueryData(rpc.conversation.settings.queryKey(), saved),
  }));

  return {
    settings: settings.data,
    isPending: configure.isPending,
    configure: (input: ConversationConfigureInput) => configure.mutate(input),
  };
}
