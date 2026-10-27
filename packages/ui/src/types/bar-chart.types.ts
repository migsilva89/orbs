export type BarChartCell = string | number | null;

export type BarChartRow = Record<string, BarChartCell>;

export interface BarChartSeries {
  key: string
  label: string
}

export interface BarChartScale {
  top: number
  ticks: number[]
}

export interface BarChartGroup {
  group: number
  bar: number
  gap: number
}

export interface BarChartReading {
  key: string
  label: string
  color: string
  value: string
}
