import { themeSnapshot, themeStorePalettes } from './theme.utils';
import type { ThemeState } from '@repo/client/web';
import type { ThemePalette } from '@repo/contracts/universal';

export function themeActionCreate(state: ThemeState, palette: ThemePalette): boolean {
  return themeStorePalettes(state, palette.id, [...themeSnapshot(state).themes, palette]);
}
