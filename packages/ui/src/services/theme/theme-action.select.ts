import { themeSnapshot, themeStorePalettes } from './theme.utils';
import type { ThemeSelectParams } from '../../types/theme.types';
import type { ThemeState } from '@repo/client/web';

export function themeActionSelect(state: ThemeState, { id }: ThemeSelectParams): boolean {
  return themeStorePalettes(state, id, themeSnapshot(state).themes);
}
