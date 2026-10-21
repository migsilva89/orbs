import { queryOptions, experimental_streamedQuery as streamedQuery } from '@tanstack/react-query';
import { watchConversationContexts } from '../../contexts';
import { readConversation, watchConversation } from '../../conversation';
import { watchNotifications } from '../../notifications';
import { CHAT } from './chat.constants';
import type { ChatHistoryParams } from '../../types/chat.types';
import type { RpcContextValue } from '../../types/rpc.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

export function chatViewOptions({ client, rpc }: RpcContextValue, target: UniversalTypes.ConversationTarget) {
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
}

/** The first conversation frame as a one-shot read, for server rendering before the live watch takes over. */
export function chatInitialViewOptions(rpcs: RpcContextValue, target: UniversalTypes.ConversationTarget) {
  return queryOptions({
    ...chatViewOptions(rpcs, target),
    queryFn: ({ signal }) => readConversation(rpcs.client, target, signal),
  });
}

export function chatNotificationsOptions({ client, rpc }: RpcContextValue) {
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
}

export function chatHistoryOptions({ rpc }: RpcContextValue, { botId, conversationId, cursor }: ChatHistoryParams) {
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
}

export function chatContextsWatchOptions({ client, rpc }: RpcContextValue, target: UniversalTypes.ConversationTarget) {
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
}
