import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { watchConversations } from '../conversations';
import { useRpc } from './use-rpc';

export function useChatListSync() {
  const queryClient = useQueryClient();
  const { client, rpc } = useRpc();

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      for await (const { conversations, sections } of watchConversations(client, controller.signal)) {
        queryClient.setQueryData(rpc.conversation.list.queryKey(), conversations);
        queryClient.setQueryData(rpc.sidebarSections.list.queryKey(), sections);
      }
    })().catch(() => undefined);

    return () => controller.abort();
  }, [client, queryClient, rpc]);
}
