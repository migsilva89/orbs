import { ROOMS } from '@openbots/client/client';
import { useMutation } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useState } from 'react';
import type { RpcSession } from '@/types/rpc.types';
import type { LegendListRef } from '@legendapp/list/react-native';
import type { ChatMessage } from '@openbots/client/client';
import type { RefObject } from 'react';

export function useChatUnread(session: RpcSession, botId: string, list: RefObject<LegendListRef | null>, messages: ChatMessage[]) {
  const latestEntryId = Math.max(0, ...messages.map((message) => message.metadata?.entryId ?? 0));
  const [isAtEnd, setIsAtEnd] = useState(true);
  const [seenThrough, setSeenThrough] = useState(latestEntryId);
  const markRead = useMutation(session.rpc.conversation.markRead.mutationOptions());

  if (isAtEnd && latestEntryId > seenThrough) {
    setSeenThrough(latestEntryId);
  }

  const read = useEffectEvent(() => {
    const chat = session.queryClient.getQueryData(session.rpc.conversation.list.queryKey())?.find((item) => item.botId === botId);

    if (seenThrough > (chat?.readThroughEntryId ?? 0)) {
      markRead.mutate({ botId, throughEntryId: seenThrough });
    }
  });

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
