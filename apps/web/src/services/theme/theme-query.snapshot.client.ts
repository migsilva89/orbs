import { THEME_CONFIG } from './theme.constants';
import { themeReadSnapshot } from './theme.utils';
import type { ThemeState } from '@/types/theme.types';

export function themeQuerySnapshot(state: ThemeState) {
  state.snapshot ??= themeReadSnapshot(THEME_CONFIG);
  return state.snapshot;
}
