import type { MotionValue } from 'motion/react';
import type { CSSProperties } from 'react';

export type LineChartRow = Record<string, string | number | null>;

export interface LineChartSeries {
  key: string
  label: string
}

export type LineChartPoint = [x: number, value: number];

export interface LineChartTrack {
  points: LineChartPoint[]
  presence: number
  fade: { stop: () => void } | null
}

export interface LineChartMove {
  key: string
  target: LineChartPoint[]
  xs: number[]
  from: number[]
  to: number[]
}

export interface LineChartScale {
  min: number
  max: number
  ticks: number[]
}

export interface LineChartModel {
  labels: string[]
  cells: Record<string, (number | null)[]>
  values: Record<string, number[]>
  signature: string
}

export type LineChartStyle = CSSProperties & Record<`--${string}`, number | string>;

export interface LineChartMotionScale {
  min: MotionValue<number>
  max: MotionValue<number>
}
