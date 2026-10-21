import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { chatNotificationsOptions } from '../services/chat/chat.client';
import { useRpc } from './use-rpc';

/** Keeps pending tool approvals and questions current: the daemon's notification watch changes whenever one appears or settles. */
export function useChatPendingSync() {
  const queryClient = useQueryClient();
  const rpcs = useRpc();
  const { data: notifications } = useQuery(chatNotificationsOptions(rpcs));

  useEffect(() => {
    if (!notifications) {
      return;
    }

    void queryClient.invalidateQueries({ queryKey: rpcs.rpc.tools.pending.key() });
    void queryClient.invalidateQueries({ queryKey: rpcs.rpc.conversation.questions.key() });
  }, [notifications, queryClient, rpcs]);

  return notifications;
}
