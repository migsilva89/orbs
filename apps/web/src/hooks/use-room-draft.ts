import { ROOMS } from '@openbots/client/client';
import { useSyncExternalStore } from 'react';

export function useRoomDraft(botId: string) {
  const key = `${ROOMS.draftKeyPrefix}${botId}`;

  const draft = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);

      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => localStorage.getItem(key) ?? '',
    () => '',
  );

  function save(text: string) {
    if (text.trim()) {
      localStorage.setItem(key, text);
    } else {
      localStorage.removeItem(key);
    }

    window.dispatchEvent(new StorageEvent('storage', { key }));
  }

  return { draft, save };
}
