import type { MotionValue } from 'motion/react';

export interface DonutChartDatum {
  label: string
  value: number
}

export interface DonutChartSlice extends DonutChartDatum {
  key: string
  color: string
}

export interface DonutChartArc {
  start: number
  end: number
}

export interface DonutChartSegment {
  start: MotionValue<number>
  end: MotionValue<number>
  lift: MotionValue<number>
  off: () => void
}

export interface DonutChartReadout {
  key: string
  label: string
  value: number
  share: number | null
}
