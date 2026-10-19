import { m } from '@openbots/i18n/client';
import { useEffect, useEffectEvent, useRef } from 'react';
import { useMessageScrollerScrollable } from '@/components/ui/message-scroller';

interface RoomsChatHistoryProps {
  direction: 'older' | 'newer'
  isEnabled: boolean
  isLoading: boolean
  onLoad: () => void
}

export function RoomsChatHistory({ direction, isEnabled, isLoading, onLoad }: RoomsChatHistoryProps) {
  const ref = useRef<HTMLDivElement>(null);
  const load = useEffectEvent(onLoad);
  const scrollable = useMessageScrollerScrollable();
  const scrolledAway = direction === 'older' ? scrollable.end : scrollable.start;
  const label = direction === 'older' ? m.rooms_chat_loading_older() : m.rooms_chat_loading_newer();

  useEffect(() => {
    const node = ref.current;

    if (!node || !isEnabled || isLoading || !scrolledAway) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) {
        return;
      }

      observer.disconnect();
      load();
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [isEnabled, isLoading, scrolledAway]);

  return (
    <div className="h-6 text-center text-xs text-muted-foreground" ref={ref}>
      {isLoading ? label : null}
    </div>
  );
}
