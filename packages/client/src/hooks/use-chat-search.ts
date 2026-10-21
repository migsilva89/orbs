import { keepPreviousData, useQueries, useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { ROOMS } from '../services/rooms/rooms.constants';
import { roomsSearchResults } from '../services/rooms/rooms.utils';
import { useRpc } from './use-rpc';

/** Searches every chat's messages for `query` after a short pause in typing, grouped by chat. */
export function useChatSearch(query: string, isEnabled = true) {
  const { rpc } = useRpc();
  const { data: chats = [] } = useQuery(rpc.conversation.list.queryOptions());
  const [debounced, setDebounced] = useState('');
  const typed = debounced.trim();

  const searches = useQueries({
    queries: chats.map((chat) => ({
      ...rpc.conversation.search.queryOptions({ input: { botId: chat.botId, query: typed } }),
      enabled: isEnabled && typed !== '',
      placeholderData: keepPreviousData,
    })),
    combine: (results) => ({
      hits: results.flatMap((result, index) => (result.data?.messages ?? []).map((message) => ({ ...message, botId: chats[index]?.botId ?? '' }))),
      isFetching: results.some((result) => result.isFetching),
    }),
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), ROOMS.searchDebounceMs);

    return () => clearTimeout(timer);
  }, [query]);

  return {
    typed,
    isPending: query.trim() !== '' && (query !== debounced || searches.isFetching),
    results: roomsSearchResults({
      chats,
      hits: typed ? searches.hits : [],
      query: typed,
    }),
  };
}
