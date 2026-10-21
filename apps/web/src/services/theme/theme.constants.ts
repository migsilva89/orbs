import { THEME_PRESETS } from '@openbots/client/client';
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
  presets: THEME_PRESETS,
};

export const THEME_SERVER_SNAPSHOT: ThemeSnapshot = {
  choice: 'system',
  resolved: 'light',
  selected: 'openbots',
  themes: THEME_PRESETS,
};
