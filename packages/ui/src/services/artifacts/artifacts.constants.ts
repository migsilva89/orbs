export const ARTIFACTS = {
  chartColors: [
    'var(--foreground)',
    'color-mix(in srgb, var(--foreground) 70%, var(--background))',
    'color-mix(in srgb, var(--foreground) 48%, var(--background))',
    'color-mix(in srgb, var(--foreground) 32%, var(--background))',
    'color-mix(in srgb, var(--foreground) 20%, var(--background))',
    'color-mix(in srgb, var(--foreground) 12%, var(--background))',
  ],
  badges: { secondary: 'outline-secondary', outline: 'outline', destructive: 'destructive' },
  gaps: { sm: 'gap-2', md: 'gap-4', lg: 'gap-6' },
  columns: { '1': 'grid-cols-1', '2': 'sm:grid-cols-2', '3': 'sm:grid-cols-2 lg:grid-cols-3', '4': 'sm:grid-cols-2 lg:grid-cols-4' },
  headings: { '1': 'text-base font-semibold text-balance', '2': 'text-base font-semibold text-balance', '3': 'text-sm font-semibold text-balance' },
} as const;
