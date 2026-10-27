import { themeSnapshot } from './theme.utils';
import type { ThemeSnapshot, ThemeState } from '@repo/client/web';

export function themeQuerySnapshot(state: ThemeState): ThemeSnapshot {
  return themeSnapshot(state);
}
