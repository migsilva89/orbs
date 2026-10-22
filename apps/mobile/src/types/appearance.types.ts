import type { APPEARANCE_CHOICES } from '@/services/appearance/appearance.constants';
import type { ThemePalette } from '@repo/contracts/universal';

export type AppearanceChoice = typeof APPEARANCE_CHOICES[number];

export type AppearanceTokens = Record<string, string>;

export type AppearanceImport = { light: AppearanceTokens; dark: AppearanceTokens; error?: never } | { error: 'modes' | 'values' };

export interface AppearancePalettes {
  selected: string;
  themes: ThemePalette[];
}

export interface AppearanceContextValue extends AppearancePalettes {
  select: (id: string) => boolean;
  create: (palette: ThemePalette) => boolean;
}

export interface AppearanceVariablesParams {
  tokens: AppearanceTokens;
}

export interface AppearanceParseParams {
  css: string;
}
