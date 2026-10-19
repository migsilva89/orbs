import { useSyncExternalStore } from 'react';

export function useIsStandalone() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const media = window.matchMedia('(display-mode: standalone)');
      media.addEventListener('change', onStoreChange);

      return () => media.removeEventListener('change', onStoreChange);
    },
    () => document.documentElement.dataset.shell === 'standalone',
    () => false,
  );
}
