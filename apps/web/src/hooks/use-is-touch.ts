import { useSyncExternalStore } from 'react';

const TOUCH_QUERY = '(pointer: coarse)';

export function useIsTouch() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(TOUCH_QUERY);
      mediaQuery.addEventListener('change', onStoreChange);

      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(TOUCH_QUERY).matches,
    () => false,
  );
}
