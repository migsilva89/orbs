import { preferences, preferencesStored } from '@repo/contracts/universal';
import { useSyncExternalStore } from 'react';
import { PREFERENCES } from '@/services/preferences/preferences.constants';
import type { Preferences } from '@repo/contracts/universal';

export function usePreferences() {
  const stored = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener('storage', onStoreChange);

      return () => window.removeEventListener('storage', onStoreChange);
    },
    () => localStorage.getItem(PREFERENCES.storageKey),
    () => null,
  );

  const values = preferencesStored.safeParse(stored).data ?? preferences.parse({});

  function save(next: Preferences) {
    localStorage.setItem(PREFERENCES.storageKey, JSON.stringify(next));
    window.dispatchEvent(new StorageEvent('storage', { key: PREFERENCES.storageKey }));
  }

  return { preferences: values, save };
}

