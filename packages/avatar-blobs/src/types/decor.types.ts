export interface DecorDotRender {
  x: number
  y: number
  r: number
  opacity: number
  color?: string
  depth?: number
  d?: string
  rot?: number
}

export interface DecorArcSpec {
  id: string
  seed: DecorArcSeed
  t: number
  opacity: number
}

export interface DecorArcRender {
  id: string
  front: string
  back: string
  width: number
  opacity: number
  grad: { x1: number; y1: number; x2: number; y2: number; stops: string[] }
}

export interface DecorArcSeed {
  a: number
  k: number
  tilt: number
  speed: number
  phase: number
  sweep: number
  hue: number
  hueSpan: number
  width: number
  cx: number
  cy: number
}
