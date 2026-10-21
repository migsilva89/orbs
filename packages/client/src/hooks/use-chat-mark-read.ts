import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

/** Marks a chat read through an entry, skipping the call when the cached chat is already read that far. */
export function useChatMarkRead(botId: string) {
  const queryClient = useQueryClient();
  const { rpc } = useRpc();
  const markRead = useMutation(rpc.conversation.markRead.mutationOptions());

  return (throughEntryId: number) => {
    const chat = queryClient.getQueryData(rpc.conversation.list.queryKey())?.find((item) => item.botId === botId);

    if (throughEntryId > (chat?.readThroughEntryId ?? 0)) {
      markRead.mutate({ botId, throughEntryId });
    }
  };
}
