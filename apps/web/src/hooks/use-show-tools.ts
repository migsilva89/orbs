import { ROOMS } from '@openbots/client/client';
import { useSyncExternalStore } from 'react';

export function useShowTools() {
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
