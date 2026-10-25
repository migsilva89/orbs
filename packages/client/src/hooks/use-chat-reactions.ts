import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { CHAT } from '../services/chat/chat.constants';
import { useRpc } from './use-rpc';
import type { ChatReactionsParams } from '../types/chat.types';

export function useChatReactions({ botId, conversationId, entryIds, revision }: ChatReactionsParams) {
  const { rpc } = useRpc();
  const queryClient = useQueryClient();
  const size = CHAT.reactionsPageSize;
  const pages = Array.from({ length: Math.ceil(entryIds.length / size) }, (_, index) => entryIds.slice(index * size, (index + 1) * size));

  const reactions = useQueries({
    queries: pages.map((ids) => rpc.conversation.reactions.queryOptions({ input: { botId, conversationId, entryIds: ids } })),
    combine: (results) => new Map(results.flatMap((result) => result.data ?? []).map((reaction) => [reaction.entryId, reaction])),
  });

  useEffect(() => {
    void queryClient.invalidateQueries({ queryKey: rpc.conversation.reactions.key({ input: { botId, conversationId } }) });
  }, [botId, conversationId, queryClient, rpc, revision]);

  return reactions;
}
