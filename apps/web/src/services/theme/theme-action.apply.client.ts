import { themeQuerySnapshot } from './theme-query.snapshot.client';
import { THEME_CONFIG } from './theme.constants';
import { themeApplySnapshot } from './theme.utils';
import type { ThemeState } from '@/types/theme.types';

export function themeActionApply(state: ThemeState) {
  const snapshot = themeQuerySnapshot(state);
  themeApplySnapshot(snapshot, THEME_CONFIG);
  window.__electrobunSendToHost?.({ theme: snapshot.resolved });
  for (const listener of state.listeners) {
    listener();
  }
}
