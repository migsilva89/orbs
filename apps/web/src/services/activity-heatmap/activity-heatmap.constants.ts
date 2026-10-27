import { ARTIFACTS } from '@/services/artifacts/artifacts.constants';
import type { Variants } from 'motion/react';

export const ACTIVITY_HEATMAP = {
  day: 86_400_000,
  week: 7,
  wave: 420,
  waveStep: 12,
  revealTail: 700,
  hideDelay: 110,
  touchHideDelay: 2400,
  previewDelay: 90,
  tipInset: 13,
  levels: [0, 1, 2, 3, 4],
  canvas: {
    '--gap': '3px',
    '--label': '30px',
    '--cell': 'clamp(9px, calc((100cqi - var(--label) - var(--gap) * 53) / 53), 15px)',
    '--step': 'calc(var(--cell) + var(--gap))',
  },
  colors: {
    '--level-0': 'color-mix(in oklab, var(--foreground) 7%, var(--muted))',
    '--level-1': ARTIFACTS.chartColors[3],
    '--level-2': ARTIFACTS.chartColors[2],
    '--level-3': ARTIFACTS.chartColors[1],
    '--level-4': ARTIFACTS.chartColors[0],
    '--ease-standard': 'cubic-bezier(.22, 1, .36, 1)',
    '--ease-enter': 'cubic-bezier(.16, 1, .3, 1)',
    '--ease-spring': 'linear(0, 0.0213, 0.0739, 0.1443, 0.2235, 0.305, 0.3849, 0.4606, 0.5305, 0.594, 0.6508, 0.7011, 0.7452, 0.7836, 0.8168, 0.8454, 0.8699, 0.8907, 0.9084, 0.9234, 0.9361, 0.9467, 0.9557, 0.9632, 0.9694, 0.9747, 0.979, 0.9826, 0.9857, 0.9882, 0.9902, 0.992, 0.9934, 0.9946, 0.9955, 0.9963, 1)',
  },
  snappy: { type: 'spring', visualDuration: 0.26, bounce: 0 },
  morph: { type: 'spring', visualDuration: 0.42, bounce: 0 },
  open: { type: 'spring', visualDuration: 0.26, bounce: 0, opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] } },
  close: { duration: 0.12, ease: [0.22, 1, 0.36, 1] },
  reducedOpen: { duration: 0.16 },
  text: { duration: 0.24, ease: [0.16, 1, 0.3, 1] },
  reducedText: { duration: 0.16 },
  tipText: {
    from: (change: number | 'instant') => (change === 'instant'
      ? { opacity: 1, y: '0em', filter: 'blur(0px)' }
      : { opacity: 0, y: `${0.3 * (change || 1)}em`, filter: `blur(${change ? 4 : 2}px)` }),
    to: { opacity: 1, y: '0em', filter: 'blur(0px)' },
    gone: (change: number | 'instant') => (change === 'instant'
      ? { opacity: 0, transition: { duration: 0 } }
      : { opacity: 0, y: `${-0.3 * (change || 1)}em`, filter: 'blur(2px)', transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } }),
  } satisfies Variants,
  reducedTipText: {
    from: (change: number | 'instant') => (change === 'instant' ? { opacity: 1 } : { opacity: 0 }),
    to: { opacity: 1 },
    gone: { opacity: 0, transition: { duration: 0 } },
  } satisfies Variants,
} as const;
