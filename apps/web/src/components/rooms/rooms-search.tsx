import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { keepPreviousData, useQueries, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { BotAvatar } from '@/components/bots/bot-avatar';
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Kbd } from '@/components/ui/kbd';
import { Skeleton } from '@/components/ui/skeleton';
import { roomsLink, roomsSearchResults, roomsSearchSnippet } from '@/services/rooms/rooms.client';
import { ROOMS } from '@/services/rooms/rooms.constants';
import { rpc } from '@/services/rpc/rpc.client';
import type { RoomsSearchEntry } from '@/types/rooms.types';

export function RoomsSearch() {
  const navigate = useNavigate();
  const { find } = useSearch({ from: '/_chat' });
  const { data: chats } = useSuspenseQuery(rpc.conversation.list.queryOptions());
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const typed = debounced.trim();

  const searches = useQueries({
    queries: chats.map((chat) => ({
      ...rpc.conversation.search.queryOptions({ input: { botId: chat.botId, query: typed } }),
      enabled: find === true && typed !== '',
      placeholderData: keepPreviousData,
    })),
    combine: (results) => ({
      hits: results.flatMap((result, index) => (result.data?.messages ?? []).map((message) => ({ ...message, botId: chats[index]?.botId ?? '' }))),
      isFetching: results.some((result) => result.isFetching),
    }),
  });

  const pending = query.trim() !== '' && (query !== debounced || searches.isFetching);

  const results = roomsSearchResults({
    chats,
    hits: typed ? searches.hits : [],
    query: typed,
  });

  function close() {
    setQuery('');
    setDebounced('');
    void navigate({
      to: '.',
      search: (previous) => ({ ...previous, find: undefined }),
      replace: true,
    });
  }

  function openChat(entry: RoomsSearchEntry, entryId?: number) {
    setQuery('');
    setDebounced('');
    void navigate({ ...roomsLink({ handle: entry.chat.handle }), search: { message: entryId } });
  }

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), ROOMS.searchDebounceMs);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <CommandDialog
      description={m.rooms_search_hint()}
      open={find === true}
      shouldFilter={false}
      title={m.rooms_search()}
      onOpenChange={(open) => !open && close()}
    >
      <CommandInput
        placeholder={m.rooms_search_placeholder()}
        value={query}
        onKeyDown={(event) => {
          const index = Number(event.key) - 1;
          const entry = index >= 0 && index < ROOMS.searchShortcuts ? results.chats.at(index) : undefined;

          if ((event.metaKey || event.ctrlKey) && !typed && entry) {
            event.preventDefault();
            openChat(entry);
          }
        }}
        onValueChange={setQuery}
      />
      <CommandList>
        {pending && results.groups.length === 0 ? (
          <div aria-hidden="true" className="grid gap-4 px-4 py-3">
            {Array.from({ length: ROOMS.searchSkeletonRows }, (_, index) => (
              <div className="grid gap-1.5" key={index}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        ) : null}
        {typed && !pending ? <CommandEmpty>{m.rooms_search_empty()}</CommandEmpty> : null}
        {results.chats.length > 0 ? (
          <CommandGroup heading={typed ? m.rooms_search_conversations() : undefined}>
            {results.chats.map((entry, index) => (
              <CommandItem
                key={entry.chat.botId}
                value={`chat:${entry.chat.botId}`}
                onSelect={() => openChat(entry)}
              >
                <BotAvatar
                  animate={false}
                  bot={{ name: entry.chat.name, avatar: entry.chat.avatar ?? undefined }}
                  size={40}
                />
                <span className="grid min-w-0 flex-1 leading-tight">
                  <span className="truncate font-medium">{entry.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{entry.chat.lastMessage?.preview ?? m.rooms_last_activity_none()}</span>
                </span>
                {!typed && index < ROOMS.searchShortcuts ? <Kbd>{`⌘${index + 1}`}</Kbd> : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ) : null}
        {results.groups.map((group) => (
          <CommandGroup heading={group.title} key={group.chat.botId}>
            {group.hits.map((hit) => (
              <CommandItem
                key={hit.entryId}
                value={`entry:${group.chat.botId}:${hit.entryId}`}
                onSelect={() => openChat(group, hit.entryId)}
              >
                <span className="grid min-w-0 flex-1 gap-0.5">
                  <span className="flex min-w-0 items-baseline justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate font-medium">{hit.role === 'user' ? m.rooms_chat_you() : group.title}</span>
                    <time className="shrink-0 tabular-nums" dateTime={new Date(hit.createdAt).toISOString()}>
                      {new Date(hit.createdAt).toLocaleDateString(getLocale(), { dateStyle: 'medium' })}
                    </time>
                  </span>
                  <span className="line-clamp-2 text-sm text-pretty text-muted-foreground">
                    {roomsSearchSnippet({ text: hit.text, query: typed }).map((part) => (part.match
                      ? <mark className="bg-transparent font-semibold text-foreground underline decoration-foreground/50 decoration-2 underline-offset-2" key={part.start}>{part.text}</mark>
                      : <span key={part.start}>{part.text}</span>))}
                  </span>
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
