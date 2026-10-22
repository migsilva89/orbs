import { THEME_PRESETS } from '@repo/client/client';
import { themePreferences } from '@repo/contracts/universal';
import * as SecureStore from 'expo-secure-store';
import { Uniwind } from 'uniwind';
import { APPEARANCE_CHOICES, APPEARANCE_DARK_SELECTORS, APPEARANCE_PALETTES_KEY, APPEARANCE_STORAGE_KEY } from './appearance.constants';
import { appearanceColors } from './appearance.utils';
import type * as AppearanceTypes from '@/types/appearance.types';

export function appearanceRead(): AppearanceTypes.AppearanceChoice {
  const saved = SecureStore.getItem(APPEARANCE_STORAGE_KEY);

  return APPEARANCE_CHOICES.find((choice) => choice === saved) ?? 'system';
}

export function appearanceSave(choice: AppearanceTypes.AppearanceChoice) {
  SecureStore.setItem(APPEARANCE_STORAGE_KEY, choice);
  Uniwind.setTheme(choice);
}

export function appearancePalettesRead(): AppearanceTypes.AppearancePalettes {
  const stored = themePreferences.safeParse(JSON.parse(SecureStore.getItem(APPEARANCE_PALETTES_KEY) ?? 'null'));

  if (!stored.success) {
    return { selected: 'default', themes: THEME_PRESETS };
  }

  const themes = [...THEME_PRESETS, ...stored.data.custom.filter((theme) => !THEME_PRESETS.some((preset) => preset.id === theme.id))];

  return { selected: themes.some((theme) => theme.id === stored.data.selected) ? stored.data.selected : 'default', themes };
}

export function appearancePalettesSave({ selected, themes }: AppearanceTypes.AppearancePalettes) {
  const custom = themes.filter((theme) => !THEME_PRESETS.some((preset) => preset.id === theme.id));

  SecureStore.setItem(APPEARANCE_PALETTES_KEY, JSON.stringify({ selected, custom }));
}

export function appearanceVariables({ tokens }: AppearanceTypes.AppearanceVariablesParams) {
  return Object.fromEntries(Object.entries(tokens)
    .filter(([token]) => token !== '--radius')
    .map(([token, value]) => [`--color-${token.slice(2)}`, value]));
}

export function appearanceParseCss({ css }: AppearanceTypes.AppearanceParseParams): AppearanceTypes.AppearanceImport {
  const light: AppearanceTypes.AppearanceTokens = {};
  const dark: AppearanceTypes.AppearanceTokens = {};

  for (const [, selectorText = '', body = ''] of css.replaceAll('\u2014', '--').matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const selectors = selectorText.split(',').map((selector) => selector.trim());

    const targets = [
      ...(selectors.includes(':root') ? [light] : []),
      ...(selectors.some((selector) => APPEARANCE_DARK_SELECTORS.includes(selector)) ? [dark] : []),
    ];

    for (const [, token = '', value = ''] of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
      for (const target of targets) {
        target[token] = value.trim();
      }
    }
  }

  if (Object.keys(light).length === 0 || Object.keys(dark).length === 0) {
    return { error: 'modes' };
  }

  const lightTokens = appearanceColors({ tokens: light });
  const darkTokens = appearanceColors({ tokens: { ...light, ...dark } });

  if (Object.keys(lightTokens).length === 0 || Object.keys(darkTokens).length === 0) {
    return { error: 'values' };
  }

  return { light: lightTokens, dark: darkTokens };
}
