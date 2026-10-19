import { z } from 'zod';

const themeTokens = z.record(z.string().startsWith('--'), z.string());

export const themePalette = z.object({
  id: z.string(),
  name: z.string(),
  light: themeTokens,
  dark: themeTokens,
});

export const themePreferences = z.object({
  selected: z.string(),
  custom: z.array(themePalette),
});

export type ThemePalette = z.infer<typeof themePalette>;
