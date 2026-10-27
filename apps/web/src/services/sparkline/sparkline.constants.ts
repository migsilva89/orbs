export const SPARKLINE = {
  width: 160,
  height: 52,
  inset: 5,
  cap: 1.25,
  lead: 16,
  grid: 160,
  inView: 0.5,
  dot: { rest: 7, active: 10 },
  draw: { duration: 0.84, ease: [0.65, 0, 0.35, 1] },
  quick: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
  spring: {
    snappy: { type: 'spring', visualDuration: 0.26, bounce: 0 },
    smooth: { type: 'spring', visualDuration: 0.4, bounce: 0 },
    morph: { type: 'spring', visualDuration: 0.42, bounce: 0 },
  },
} as const;
