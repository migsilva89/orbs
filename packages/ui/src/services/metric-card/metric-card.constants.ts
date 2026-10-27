export const METRIC_CARD = {
  numeric: /^[-−]?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?$/,
  maxDecimals: 3,
  spring: {
    snappy: { type: 'spring', visualDuration: 0.26, bounce: 0 },
    morph: { type: 'spring', visualDuration: 0.42, bounce: 0 },
  },
  exit: { duration: 0.16, ease: [0.22, 1, 0.36, 1] },
} as const;
