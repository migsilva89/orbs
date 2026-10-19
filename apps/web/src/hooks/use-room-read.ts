import { useEffect, useEffectEvent, useState } from 'react';
import { rpc } from '@/services/rpc/rpc.client';

export function useRoomRead(botId: string, readThroughEntryId: number, latestEntryId: number) {
  const [divider, setDivider] = useState(readThroughEntryId);
  const [isSeen, setIsSeen] = useState(false);
  const isPending = () => latestEntryId > readThroughEntryId && document.visibilityState === 'visible' && document.hasFocus();

  const read = useEffectEvent(() => {
    if (isPending()) {
      void rpc.conversation.markRead.call({ botId, throughEntryId: latestEntryId });
    }
  });

  const back = useEffectEvent(() => {
    if (!isPending()) {
      return;
    }

    setDivider(readThroughEntryId);
    setIsSeen(false);
    read();
  });

  useEffect(() => {
    read();
  }, [latestEntryId]);

  useEffect(() => {
    const returned = () => back();

    window.addEventListener('focus', returned);
    document.addEventListener('visibilitychange', returned);

    return () => {
      window.removeEventListener('focus', returned);
      document.removeEventListener('visibilitychange', returned);
    };
  }, []);

  return { throughEntryId: divider, isSeen, onSeen: () => setIsSeen(true) };
}
