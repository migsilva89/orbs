import type { Variants } from 'motion/react';

export const TEXT_SWAP = {
  rise: {
    hidden: (direction: number) => ({ opacity: 0, y: `${0.3 * direction}em`, filter: 'blur(4px)' }),
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
    gone: (direction: number) => ({ opacity: 0, y: `${-0.3 * direction}em`, filter: 'blur(2px)', transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } }),
  } satisfies Variants,
  fade: {
    hidden: { opacity: 0, y: 0, filter: 'blur(0px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.12 } },
    gone: { opacity: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0.12 } },
  } satisfies Variants,
} as const;
