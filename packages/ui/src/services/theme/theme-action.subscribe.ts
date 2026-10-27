import { THEME_CONFIG } from '@repo/client/web';
import { themeApply } from './theme.utils';
import type { ThemeState, ThemeSubscriber } from '@repo/client/web';

export function themeActionSubscribe(state: ThemeState, listener: ThemeSubscriber) {
  state.listeners.add(listener);
  themeApply(state);

  if (!state.cleanup) {
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    const themeRefresh = () => {
      state.snapshot = undefined;
      themeApply(state);
    };

    const themeSyncStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== THEME_CONFIG.modeKey && event.key !== THEME_CONFIG.palettesKey) {
        return;
      }

      themeRefresh();
    };

    window.addEventListener('storage', themeSyncStorage);
    media.addEventListener('change', themeRefresh);
    state.cleanup = () => {
      window.removeEventListener('storage', themeSyncStorage);
      media.removeEventListener('change', themeRefresh);
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
