import type { DecorArcRender, DecorDotRender } from './decor.types';

export interface EngineRenderedEye {
  d: string
  matrix: string
  alpha: number
}

export interface EngineFrame {
  bodyPath: string
  bodyAlpha: number
  eyes: EngineRenderedEye[]
  dots: DecorDotRender[]
  dotsBehind: boolean
  arcs: DecorArcRender[]
  notif: { x: number; y: number; r: number } | null
  notch: { x: number; y: number; r: number } | null
}

export interface EngineLook {
  yaw: number
  pitch: number
  mix: number
  spin: number
  wander: number
}
