import { THEME_CONFIG } from '@repo/client/web';
import { themeStore } from './theme.utils';
import type { ThemeChoice, ThemeState } from '@repo/client/web';

export function themeActionChoose(state: ThemeState, choice: ThemeChoice): boolean {
  return themeStore(state, THEME_CONFIG.modeKey, choice);
}
