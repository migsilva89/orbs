import { themeActionApply } from './theme-action.apply.client';
import { THEME_CONFIG } from './theme.constants';
import type { ThemeState, ThemeSubscriber } from '@/types/theme.types';

export function themeActionSubscribe(state: ThemeState, listener: ThemeSubscriber) {
  state.listeners.add(listener);
  themeActionApply(state);

  if (!state.cleanup) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const themeApply = () => {
      state.snapshot = undefined;
      themeActionApply(state);
    };

    const themeSyncStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_CONFIG.modeKey && event.key !== THEME_CONFIG.palettesKey) {
        return;
      }

      themeApply();
    };

    window.addEventListener('storage', themeSyncStorage);
    media.addEventListener('change', themeApply);
    state.cleanup = () => {
      window.removeEventListener('storage', themeSyncStorage);
      media.removeEventListener('change', themeApply);
    };
  }

  return () => {
    state.listeners.delete(listener);

    if (state.listeners.size === 0) {
      state.cleanup?.();
      state.cleanup = undefined;
    }
  };
}
