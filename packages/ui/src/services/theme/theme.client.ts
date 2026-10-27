import { THEME_SERVER_SNAPSHOT } from '@repo/client/web';
import { themeActionChoose } from './theme-action.choose';
import { themeActionCreate } from './theme-action.create';
import { themeActionSelect } from './theme-action.select';
import { themeActionSubscribe } from './theme-action.subscribe';
import { themeQuerySnapshot } from './theme-query.snapshot';
import type * as ThemeTypes from '@repo/client/web';
import type { ThemePalette } from '@repo/contracts/universal';

export function themeCreateService() {
  const state: ThemeTypes.ThemeState = { listeners: new Set() };

  return {
    subscribe: (listener: ThemeTypes.ThemeSubscriber) => themeActionSubscribe(state, listener),
    getSnapshot: () => themeQuerySnapshot(state),
    getServerSnapshot: () => THEME_SERVER_SNAPSHOT,
    setChoice: (choice: ThemeTypes.ThemeChoice) => themeActionChoose(state, choice),
    select: (id: string) => themeActionSelect(state, { id }),
    create: (palette: ThemePalette) => themeActionCreate(state, palette),
  };
}
