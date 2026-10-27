export const LINE_CHART = {
  height: 220,
  top: 12,
  gap: 14,
  axisSpacing: 76,
  dotRadius: 4,
  rows: 4,
  morphSteps: 240,
  curveSamples: 192,
  maxSegmentSamples: 16,
  duration: { instant: 0.12, fast: 0.16, standard: 0.24, considered: 0.48 },
  ease: {
    standard: [0.22, 1, 0.36, 1],
    inOut: [0.65, 0, 0.35, 1],
  },
  spring: {
    snappy: { visualDuration: 0.26, bounce: 0 },
    smooth: { visualDuration: 0.4, bounce: 0 },
  },
} as const;
