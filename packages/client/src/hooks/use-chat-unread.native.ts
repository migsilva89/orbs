import { useEffect, useEffectEvent, useState } from 'react';
import { ROOMS } from '../services/rooms/rooms.constants';
import { useChatMarkRead } from './use-chat-mark-read';
import type { ChatMessage } from '../types/chat.types';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { RefObject } from 'react';

/** Counts replies below the visible end of the list and marks them read once the owner scrolls to them. */
export function useChatUnread(botId: string, list: RefObject<LegendListRef | null>, messages: ChatMessage[]) {
  const latestEntryId = Math.max(0, ...messages.map((message) => message.metadata?.entryId ?? 0));
  const [isAtEnd, setIsAtEnd] = useState(true);
  const [seenThrough, setSeenThrough] = useState(latestEntryId);
  const markRead = useChatMarkRead(botId);

  if (isAtEnd && latestEntryId > seenThrough) {
    setSeenThrough(latestEntryId);
  }

  const read = useEffectEvent(() => markRead(seenThrough));

  useEffect(() => list.current?.getState().listen('isNearEnd', setIsAtEnd), [list]);

  useEffect(() => {
    const timer = setTimeout(read, ROOMS.unreadSeenMs);

    return () => clearTimeout(timer);
  }, [botId, seenThrough]);

  return {
    count: messages.filter((message) => message.role !== 'user' && message.parts.length > 0 && (message.metadata?.entryId ?? 0) > seenThrough).length,
    seeAll: () => {
      setSeenThrough(latestEntryId);
      void list.current?.scrollToEnd({ animated: true });
    },
  };
}
