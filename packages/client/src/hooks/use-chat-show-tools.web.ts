import { useSyncExternalStore } from 'react';
import { ROOMS } from '../services/rooms/rooms.constants';

/** Whether tool calls show in the transcript, kept in localStorage. */
export function useChatShowTools() {
  const shown = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);

      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => localStorage.getItem(ROOMS.showToolsKey) === 'true',
    () => false,
  );

  function toggle() {
    localStorage.setItem(ROOMS.showToolsKey, String(!shown));
    window.dispatchEvent(new StorageEvent('storage', { key: ROOMS.showToolsKey }));
  }

  return { shown, toggle };
}
