import type { ThemeConfig, ThemeSnapshot } from '@/types/theme.types';

export const THEME_IMPORT_LIMITS = { nameLength: 80, cssLength: 64_000 };

export const THEME_CONFIG: ThemeConfig = {
  modeKey: 'openbots.theme',
  palettesKey: 'openbots.palettes',
  tokens: [
    '--background',
    '--foreground',
    '--card',
    '--card-foreground',
    '--popover',
    '--popover-foreground',
    '--primary',
    '--primary-foreground',
    '--secondary',
    '--secondary-foreground',
    '--muted',
    '--muted-foreground',
    '--accent',
    '--accent-foreground',
    '--destructive',
    '--destructive-foreground',
    '--border',
    '--input',
    '--ring',
    '--sidebar',
    '--sidebar-foreground',
    '--sidebar-primary',
    '--sidebar-primary-foreground',
    '--sidebar-accent',
    '--sidebar-accent-foreground',
    '--sidebar-border',
    '--sidebar-ring',
    '--chart-1',
    '--chart-2',
    '--chart-3',
    '--chart-4',
    '--chart-5',
    '--success',
    '--success-foreground',
    '--warning',
    '--warning-foreground',
    '--skill',
    '--radius',
  ],
  presets: [
    { id: 'openbots', name: 'Openbots', light: {}, dark: {} },
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
  ],
};

export const THEME_SERVER_SNAPSHOT: ThemeSnapshot = {
  choice: 'system',
  resolved: 'light',
  selected: 'openbots',
  themes: THEME_CONFIG.presets,
};
