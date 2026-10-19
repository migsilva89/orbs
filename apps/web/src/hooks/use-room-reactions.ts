import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CHAT } from '@/services/chat/chat.constants';
import { rpc } from '@/services/rpc/rpc.client';
import type { ChatMessage } from '@/types/chat.types';

export function useRoomReactions(botId: string, conversationId: number, messages: ChatMessage[], revision: number) {
  const queryClient = useQueryClient();
  const entryIds = [...new Set(messages.flatMap((message) => (message.metadata?.entryId ? [message.metadata.entryId] : [])))];
  const size = CHAT.reactionsPageSize;
  const chunks = Array.from({ length: Math.ceil(entryIds.length / size) }, (_, index) => entryIds.slice(index * size, (index + 1) * size));

  const reactions = useQueries({
    queries: chunks.map((ids) => rpc.conversation.reactions.queryOptions({ input: { botId, conversationId, entryIds: ids } })),
    combine: (results) => results.flatMap((result) => result.data ?? []),
  });

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: rpc.conversation.reactions.key({ input: { botId, conversationId } }) });
  }, [botId, conversationId, queryClient, revision]);

  return reactions;
}
