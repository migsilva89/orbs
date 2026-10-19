import { m } from '@openbots/i18n/client';
import { useEffect, useEffectEvent, useRef } from 'react';
import { ROOMS } from '@/services/rooms/rooms.constants';

interface RoomsChatUnreadProps {
  seen: boolean
  onSeen: () => void
}

export function RoomsChatUnread({ seen, onSeen }: RoomsChatUnreadProps) {
  const line = useRef<HTMLDivElement>(null);
  const markSeen = useEffectEvent(onSeen);

  useEffect(() => {
    const node = line.current;

    if (seen || !node) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scrolled = () => markSeen();

    const observer = new IntersectionObserver(([entry]) => {
      clearTimeout(timer);
      window.removeEventListener('wheel', scrolled);
      window.removeEventListener('touchmove', scrolled);

      if (entry.isIntersecting) {
        timer = setTimeout(scrolled, ROOMS.unreadSeenMs);
        window.addEventListener('wheel', scrolled, { passive: true });
        window.addEventListener('touchmove', scrolled, { passive: true });
      }
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
      clearTimeout(timer);
      window.removeEventListener('wheel', scrolled);
      window.removeEventListener('touchmove', scrolled);
    };
  }, [seen]);

  return (
    <div
      aria-hidden={seen}
      className="grid grid-rows-[1fr] transition-all duration-500 ease-out-quint data-[seen=true]:grid-rows-[0fr] data-[seen=true]:opacity-0 motion-reduce:transition-none"
      data-seen={seen}
      ref={line}
    >
      <div className="min-h-0 overflow-hidden">
        <div className="flex items-center gap-3 py-4 text-xs font-medium text-sky-500 dark:text-sky-400">
          <span className="h-px flex-1 bg-current opacity-30" />
          {m.rooms_unread_divider()}
          <span className="h-px flex-1 bg-current opacity-30" />
        </div>
      </div>
    </div>
  );
}
