import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRpc } from './use-rpc';

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
