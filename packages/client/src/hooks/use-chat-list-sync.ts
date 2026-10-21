import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { watchConversations } from '../conversations';
import { useRpc } from './use-rpc';

/** Keeps the cached chat list live from the daemon's conversation watch while mounted. */
export function useChatListSync() {
  const queryClient = useQueryClient();
  const { client, rpc } = useRpc();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      for await (const chats of watchConversations(client, controller.signal)) {
        queryClient.setQueryData(rpc.conversation.list.queryKey(), chats);
      }
    })().catch(() => undefined);

    return () => controller.abort();
  }, [client, queryClient, rpc]);
}
