import { watchConversation, watchConversationContexts, watchNotifications } from '@openbots/client/client';
import { queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query';
import { rpc, rpcClient } from '@/services/rpc/rpc.client';
import { CHAT } from './chat.constants';
import type * as ChatTypes from '@/types/chat.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function chatViewOptions(target: UniversalTypes.ConversationTarget) {
  return queryOptions({
    queryKey: rpc.conversation.watch.queryKey({ input: target }),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => watchConversation(rpcClient, target, signal),
      refetchMode: 'append',
      reducer: (_view: UniversalTypes.ConversationView | null, next: UniversalTypes.ConversationView) => next,
      initialValue: null,
    }),
    staleTime: 0,
  });
}

export function chatNotificationsOptions() {
  return queryOptions({
    queryKey: rpc.conversation.watchNotifications.queryKey(),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => watchNotifications(rpcClient, signal),
      refetchMode: 'append',
      reducer: (_state: UniversalTypes.NotificationState | null, next: UniversalTypes.NotificationState) => next,
      initialValue: null,
    }),
    staleTime: 0,
  });
}

export function chatHistoryOptions({ botId, conversationId, cursor }: ChatTypes.ChatHistoryParams) {
  return rpc.conversation.history.infiniteOptions({
    input: (pageCursor: ChatTypes.ChatHistoryParams['cursor']) => ({
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

export function chatContextsWatchOptions(target: UniversalTypes.ConversationTarget) {
  return queryOptions({
    queryKey: rpc.conversation.watchContexts.queryKey({ input: target }),
    queryFn: streamedQuery({
      streamFn: ({ signal }) => watchConversationContexts(rpcClient, target, signal),
      refetchMode: 'append',
      reducer: (_state: UniversalTypes.ConversationContextWatchState | null, next: UniversalTypes.ConversationContextWatchState) => next,
      initialValue: null,
    }),
    staleTime: 0,
  });
}
