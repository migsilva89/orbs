import { useInfiniteQuery } from '@tanstack/react-query';
import { CHAT } from '../services/chat/chat.constants';
import { chatEntryIds, chatMessages } from '../services/chat/chat.utils';
import { useChatReactions } from './use-chat-reactions';
import { useRpc } from './use-rpc';
import type { ChatAroundParams } from '../types/chat.types';
import type * as UniversalTypes from '@openbots/contracts/universal';

/** The messages around one entry, such as a search result, with older and newer pages on demand. */
export function useChatAround({ bot, bots, view, entryId }: ChatAroundParams) {
  const { rpc } = useRpc();
  const target = { botId: bot.id, conversationId: view.conversationId, limit: CHAT.aroundPageSize };

  const older = useInfiniteQuery(rpc.conversation.history.infiniteOptions({
    input: (cursor: UniversalTypes.ConversationView['historyCursor']) => ({ ...target, throughEntryId: entryId, cursor }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.next,
  }));

  const newer = useInfiniteQuery(rpc.conversation.history.infiniteOptions({
    input: (afterEntryId: number) => ({ ...target, afterEntryId }),
    initialPageParam: entryId,
    getNextPageParam: (page) => (page.items.length === CHAT.aroundPageSize ? page.items.at(-1)?.id : undefined),
  }));

  const messages = chatMessages({
    entries: [
      ...[...(older.data?.pages.flatMap((page) => page.items) ?? [])].reverse(),
      ...(newer.data?.pages.flatMap((page) => page.items) ?? []),
    ],
    bot,
    bots,
  });

  return {
    messages,
    isReady: older.isSuccess && newer.isSuccess,
    isLatest: newer.isSuccess && !newer.hasNextPage,
    older: { isEnabled: older.hasNextPage, isLoading: older.isFetchingNextPage, onLoad: () => void older.fetchNextPage() },
    newer: { isEnabled: newer.hasNextPage, isLoading: newer.isFetchingNextPage, onLoad: () => void newer.fetchNextPage() },
    reactions: useChatReactions({
      botId: bot.id,
      conversationId: view.conversationId,
      entryIds: chatEntryIds(messages),
      revision: view.interactionsRevision,
    }),
  };
}
