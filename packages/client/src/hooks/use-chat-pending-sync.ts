import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatQueries } from '../services/chat/chat.client';
import { useRpc } from './use-rpc';

export function useChatPendingSync() {
  const queryClient = useQueryClient();
  const rpcs = useRpc();
  const { data: notifications } = useQuery(chatQueries.notifications(rpcs));

  useEffect(() => {
    if (!notifications) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: rpcs.rpc.tools.pending.key() });
    void queryClient.invalidateQueries({ queryKey: rpcs.rpc.conversation.questions.key() });
  }, [notifications, queryClient, rpcs]);

  return notifications;
}
