import { useSyncExternalStore } from 'react';
import { ROOMS } from '../services/rooms/rooms.constants';
import type { RoomsPrefill } from '../types/rooms.types';

/** The composer draft for one bot, kept in localStorage and shared across tabs. */
export function useChatDraft(botId: string) {
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

  function prefill(text: string) {
    if (localStorage.getItem(key)) {
      return;
    }

    save(text);
    window.dispatchEvent(new CustomEvent<RoomsPrefill>(ROOMS.prefillEvent, { detail: { botId, text } }));
  }

  return { draft, save, prefill };
}
