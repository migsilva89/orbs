export const GAUGE = {
  radius: 42,
  start: -135,
  span: 270,
  stroke: 9,
  capFade: 0.02,
  tones: {
    default: '[--gauge:var(--foreground)]',
    success: '[--gauge:var(--success)]',
    destructive: '[--gauge:var(--destructive)]',
  },
  reveal: { type: 'spring', visualDuration: 0.768, bounce: 0 },
  morph: { type: 'spring', visualDuration: 0.42, bounce: 0 },
  smooth: { type: 'spring', visualDuration: 0.4, bounce: 0 },
} as const;
