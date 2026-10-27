export const USAGE_METER = {
  gap: 2,
  warnAt: 0.9,
  stagger: 0.07,
  free: 'free',
  empty: 'color-mix(in oklab, var(--foreground) 7%, var(--muted))',
  digits: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  blur: 2,
  springs: {
    smooth: { visualDuration: 0.4, bounce: 0 },
    reveal: { visualDuration: 0.58, bounce: 0 },
    morph: { visualDuration: 0.42, bounce: 0 },
  },
  marker: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
  column: {
    initial: { width: 0, opacity: 0 },
    animate: { width: 'auto', opacity: 1 },
    exit: { width: 0, opacity: 0 },
  },
  pop: {
    hidden: { opacity: 0, scale: 0.6, filter: 'blur(3px)' },
    shown: {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      transition: {
        type: 'spring',
        visualDuration: 0.26,
        bounce: 0,
        opacity: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
        filter: { duration: 0.16, ease: [0.16, 1, 0.3, 1] },
      },
    },
    gone: { opacity: 0, scale: 0.6, filter: 'blur(3px)', transition: { duration: 0.12, ease: [0.22, 1, 0.36, 1] } },
  },
  fade: {
    hidden: { opacity: 0, scale: 1, filter: 'blur(0px)' },
    shown: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: { duration: 0.16 } },
    gone: { opacity: 0, scale: 1, filter: 'blur(0px)', transition: { duration: 0.12 } },
  },
} as const;
