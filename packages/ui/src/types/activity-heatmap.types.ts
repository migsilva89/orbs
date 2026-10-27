import type { CSSProperties } from 'react';

export interface ActivityHeatmapDay {
  date: string
  value: number
}

export interface ActivityHeatmapMonth {
  key: string
  col: number
  label: string
}

export interface ActivityHeatmapModel {
  start: number
  length: number
  lead: number
  weeks: number
  total: number
  values: number[]
  levels: number[]
  thresholds: [number, number, number]
  months: ActivityHeatmapMonth[]
  perLevel: number[]
}

export interface ActivityHeatmapTip {
  key: string
  primary: string
  secondary: string
  value: number
  anchor: HTMLElement
}

export type ActivityHeatmapChange = 1 | -1 | 0 | 'instant';

export type ActivityHeatmapStyle = CSSProperties & Record<`--${string}`, number | string>;
