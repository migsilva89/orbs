export const APPEARANCE_STORAGE_KEY = 'bots.appearance';

export const APPEARANCE_CHOICES = ['system', 'light', 'dark'] as const;

export const APPEARANCE_PALETTES_KEY = 'bots.palettes';

export const APPEARANCE_IMPORT_LIMITS = { nameLength: 80, cssLength: 64_000 };

export const APPEARANCE_DARK_SELECTORS = ['.dark', ':root.dark', 'html.dark'];

export const APPEARANCE_COLOR_PATTERN = /^(#[\da-f]{3,8}|(rgba?|hsla?|oklch|oklab|lab|lch|hwb)\(.+\))$/i;
