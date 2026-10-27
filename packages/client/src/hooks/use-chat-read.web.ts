import { useEffect, useEffectEvent, useState } from 'react';
import { useChatMarkRead } from './use-chat-mark-read';

export function useChatRead(botId: string, readThroughEntryId: number, latestEntryId: number, isPaused = false) {
  const [divider, setDivider] = useState(readThroughEntryId);
  const [isSeen, setIsSeen] = useState(false);
  const markRead = useChatMarkRead(botId);
  const isPending = () => !isPaused && latestEntryId > readThroughEntryId && document.visibilityState === 'visible' && document.hasFocus();

  const read = useEffectEvent(() => {
    if (isPending()) {
      markRead(latestEntryId);
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
    read();
  }, [isPaused]);

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
