import { useNotificationPresence } from '@repo/client/react';
import { useEffect, useRef } from 'react';
import { ROOMS_PRESENCE_EVENTS } from '@/services/rooms/rooms.constants';

export function useRoomsPresence() {
  const activeAt = useRef(0);

  useEffect(() => {
    const touch = () => {
      activeAt.current = Date.now();
    };

    touch();

    for (const event of ROOMS_PRESENCE_EVENTS) {
      window.addEventListener(event, touch, { passive: true });
    }

    return () => {
      for (const event of ROOMS_PRESENCE_EVENTS) {
        window.removeEventListener(event, touch);
      }
    };
  }, []);

  useNotificationPresence({
    platform: 'computer',
    isOpen: true,
    idleMs: () => Date.now() - activeAt.current,
  });
}
