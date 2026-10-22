import type { ThemePalette } from '@repo/contracts/universal';

export const THEME_PRESETS: ThemePalette[] = [
  { id: 'default', name: 'Default', light: {}, dark: {} },
  {
    id: 'ocean',
    name: 'Ocean',
    light: {
      '--primary': 'oklch(0.488 0.243 264.376)',
      '--primary-foreground': 'oklch(0.985 0 0)',
      '--ring': 'oklch(0.623 0.214 259.815)',
    },
    dark: {
      '--primary': 'oklch(0.707 0.165 254.624)',
      '--primary-foreground': 'oklch(0.145 0 0)',
      '--ring': 'oklch(0.623 0.214 259.815)',
    },
  },
  {
    id: 'rose',
    name: 'Rose',
    light: {
      '--primary': 'oklch(0.514 0.222 16.935)',
      '--primary-foreground': 'oklch(0.985 0 0)',
      '--ring': 'oklch(0.645 0.246 16.439)',
    },
    dark: { '--primary': 'oklch(0.81 0.117 11.638)', '--primary-foreground': 'oklch(0.145 0 0)', '--ring': 'oklch(0.645 0.246 16.439)' },
  },
];
