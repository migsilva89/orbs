import type { ThemePalette } from '@openbots/contracts/universal';

export type ThemeResolved = 'light' | 'dark';
export type ThemeChoice = ThemeResolved | 'system';
export type ThemeTokens = Record<string, string>;

export interface ThemeSnapshot {
  choice: ThemeChoice;
  resolved: ThemeResolved;
  selected: string;
  themes: ThemePalette[];
}

export interface ThemeConfig {
  modeKey: string;
  palettesKey: string;
  tokens: string[];
  presets: ThemePalette[];
}

export interface ThemeContextValue extends ThemeSnapshot {
  setChoice: (choice: ThemeChoice) => boolean;
  select: (id: string) => boolean;
  create: (palette: ThemePalette) => boolean;
}

export type ThemeSubscriber = () => void;

export interface ThemeState {
  snapshot?: ThemeSnapshot;
  listeners: Set<ThemeSubscriber>;
  cleanup?: ThemeSubscriber;
}

export interface ThemeImportInput {
  css: string;
}

export type ThemeImport =
  { light: ThemeTokens; dark: ThemeTokens; error?: never } | { error: 'modes' | 'values'; light?: never; dark?: never };
