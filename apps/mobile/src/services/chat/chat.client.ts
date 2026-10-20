import { CHAT, watchConversation } from '@openbots/client/client';
import { queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query';
import type { RpcSession } from '@/types/rpc.types';
import type { ChatHistoryParams } from '@openbots/client/client';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function chatViewOptions(session: RpcSession, target: UniversalTypes.ConversationTarget) {
  return queryOptions({
    queryKey: session.rpc.conversation.watch.queryKey({ input: target }),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => watchConversation(session.client, target, signal),
      refetchMode: 'append',
      reducer: (_view: UniversalTypes.ConversationView | null, next: UniversalTypes.ConversationView) => next,
      initialValue: null,
    }),
    staleTime: 0,
  });
}

export function chatHistoryOptions(session: RpcSession, { botId, conversationId, cursor }: ChatHistoryParams) {
  return session.rpc.conversation.history.infiniteOptions({
    input: (pageCursor: ChatHistoryParams['cursor']) => ({
      botId,
      conversationId,
      cursor: pageCursor,
      limit: CHAT.historyPageSize,
    }),
    initialPageParam: cursor,
    getNextPageParam: (page) => page.next,
    enabled: false,
  });
}
