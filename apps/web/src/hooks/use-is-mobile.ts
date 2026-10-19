import { useSyncExternalStore } from 'react';
import { LAYOUT_MOBILE_BREAKPOINT } from '@/services/layout/layout.constants';

const MOBILE_QUERY = `(max-width: ${LAYOUT_MOBILE_BREAKPOINT - 1}px)`;

export function useIsMobile() {
  return useSyncExternalStore(
    (onStoreChange) => {
      const mediaQuery = window.matchMedia(MOBILE_QUERY);
      mediaQuery.addEventListener('change', onStoreChange);

      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}
