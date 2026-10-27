export const ANIMATED_COUNTER = {
  digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  inView: 0.6,
  stagger: 0.035,
  staggerMax: 0.25,
  blur: 2,
  spring: {
    smooth: { type: 'spring', visualDuration: 0.4, bounce: 0 },
    morph: { type: 'spring', visualDuration: 0.42, bounce: 0 },
    reveal: { type: 'spring', visualDuration: 0.48, bounce: 0 },
  },
  presence: {
    initial: { width: 0, opacity: 0 },
    animate: { width: 'auto', opacity: 1 },
    exit: { width: 0, opacity: 0 },
  },
  rise: {
    hidden: { opacity: 0, y: '0.3em', filter: 'blur(4px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.24, ease: [0.16, 1, 0.3, 1] } },
    gone: { opacity: 0, y: '-0.3em', filter: 'blur(2px)', transition: { duration: 0.16, ease: [0.22, 1, 0.36, 1] } },
  },
  fade: {
    hidden: { opacity: 0, y: 0, filter: 'blur(0px)' },
    shown: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.12 } },
    gone: { opacity: 0, y: 0, filter: 'blur(0px)', transition: { duration: 0.12 } },
  },
} as const;
