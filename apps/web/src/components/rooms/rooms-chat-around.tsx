import { CHAT, chatMessages } from '@openbots/client/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { RoomsChatTranscript } from '@/components/rooms/rooms-chat-transcript';
import { useRoomReactions } from '@/hooks/use-room-reactions';
import { rpc } from '@/services/rpc/rpc.client';
import type { ChatMessage } from '@openbots/client/client';
import type { Bot, ConversationView } from '@openbots/contracts/universal';

interface RoomsChatAroundProps {
  bot: Bot
  bots: Bot[]
  view: ConversationView
  entryId: number
  onLatest: () => void
  onReply: (message: ChatMessage) => void
}

export function RoomsChatAround({ bot, bots, view, entryId, onLatest, onReply }: RoomsChatAroundProps) {
  const target = { botId: bot.id, conversationId: view.conversationId, limit: CHAT.aroundPageSize };

  const older = useInfiniteQuery(rpc.conversation.history.infiniteOptions({
    input: (cursor: ConversationView['historyCursor']) => ({ ...target, throughEntryId: entryId, cursor }),
    initialPageParam: undefined,
    getNextPageParam: (page) => page.next,
  }));

  const newer = useInfiniteQuery(rpc.conversation.history.infiniteOptions({
    input: (afterEntryId: number) => ({ ...target, afterEntryId }),
    initialPageParam: entryId,
    getNextPageParam: (page) => (page.items.length === CHAT.aroundPageSize ? page.items.at(-1)?.id : undefined),
  }));

  const isLatest = newer.isSuccess && !newer.hasNextPage;

  useEffect(() => {
    if (isLatest) {
      onLatest();
    }
  }, [isLatest, onLatest]);

  const entries = [
    ...[...(older.data?.pages.flatMap((page) => page.items) ?? [])].reverse(),
    ...(newer.data?.pages.flatMap((page) => page.items) ?? []),
  ];

  const messages = chatMessages({
    entries,
    bot,
    bots,
  });

  const reactions = useRoomReactions(bot.id, view.conversationId, messages, view.interactionsRevision);

  return (
    <RoomsChatTranscript
      bot={bot}
      bots={bots}
      focusedEntryId={entryId}
      messages={messages}
      newer={{ isEnabled: newer.hasNextPage, isLoading: newer.isFetchingNextPage, onLoad: () => void newer.fetchNextPage() }}
      older={{ isEnabled: older.hasNextPage, isLoading: older.isFetchingNextPage, onLoad: () => void older.fetchNextPage() }}
      reactions={reactions}
      onReply={onReply}
    />
  );
}
