import { queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query';
import { watchConversationContexts } from '../../contexts';
import { readConversation, watchConversation } from '../../conversation';
import { watchConversations } from '../../conversations';
import { watchNotifications } from '../../notifications';
import { CHAT } from './chat.constants';
import type { ChatHistoryParams } from '../../types/chat.types';
import type { RpcContextValue } from '../../types/rpc.types';
import type * as UniversalTypes from '@repo/contracts/universal';

export const chatQueries = {
  view({ client, rpc }: RpcContextValue, target: UniversalTypes.ConversationTarget) {
    return queryOptions({
      queryKey: rpc.conversation.watch.queryKey({ input: target }),
      queryFn: streamedQuery({
        streamFn: ({ signal }) => watchConversation(client, target, signal),
        refetchMode: 'append',
        reducer: (_view: UniversalTypes.ConversationView | null, next: UniversalTypes.ConversationView) => next,
        initialValue: null,
      }),
      staleTime: 0,
    });
  },

  list({ client, rpc }: RpcContextValue) {
    return queryOptions({
      queryKey: rpc.conversation.list.queryKey(),
      queryFn: streamedQuery({
        async *streamFn({ client: queryClient, signal }) {
          for await (const { conversations, sections } of watchConversations(client, signal)) {
            queryClient.setQueryData(rpc.sidebarSections.list.queryKey(), sections);
            yield conversations;
          }
        },
        refetchMode: 'append',
        reducer: (_chats: UniversalTypes.ConversationListItem[], next: UniversalTypes.ConversationListItem[]) => next,
        initialValue: [],
      }),
    });
  },

  initialView(rpcs: RpcContextValue, target: UniversalTypes.ConversationTarget) {
    return queryOptions({
      ...chatQueries.view(rpcs, target),
      queryFn: ({ signal }) => readConversation(rpcs.client, target, signal),
    });
  },

  notifications({ client, rpc }: RpcContextValue) {
    return queryOptions({
      queryKey: rpc.conversation.watchNotifications.queryKey(),
      queryFn: streamedQuery({
        streamFn: ({ signal }) => watchNotifications(client, signal),
        refetchMode: 'append',
        reducer: (_state: UniversalTypes.NotificationState | null, next: UniversalTypes.NotificationState) => next,
        initialValue: null,
      }),
      staleTime: 0,
    });
  },

  history({ rpc }: RpcContextValue, { botId, conversationId, cursor }: ChatHistoryParams) {
    return rpc.conversation.history.infiniteOptions({
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
  },

  contextsWatch({ client, rpc }: RpcContextValue, target: UniversalTypes.ConversationTarget) {
    return queryOptions({
      queryKey: rpc.conversation.watchContexts.queryKey({ input: target }),
      queryFn: streamedQuery({
        streamFn: ({ signal }) => watchConversationContexts(client, target, signal),
        refetchMode: 'append',
        reducer: (_state: UniversalTypes.ConversationContextWatchState | null, next: UniversalTypes.ConversationContextWatchState) => next,
        initialValue: null,
      }),
      staleTime: 0,
    });
  },
};
