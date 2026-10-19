import { watchConversations } from '@openbots/client/client';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { rpc, rpcClient } from '@/services/rpc/rpc.client';

export function useRoomsSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      for await (const chats of watchConversations(rpcClient, controller.signal)) {
        queryClient.setQueryData(rpc.conversation.list.queryKey(), chats);
      }
    })().catch(() => undefined);

    return () => controller.abort();
  }, [queryClient]);
}
