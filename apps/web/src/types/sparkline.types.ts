export type SparklinePoint = [number, number];

export interface SparklineChunk {
  slot: string
  key: string
  text: string
}

export interface SparklineGeometry {
  points: SparklinePoint[]
  line: string
  trail: string
  fill: string
  dot: string
  cx: number
}
