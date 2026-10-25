import type { Pose } from './pose.types';
import type { SilhouettePoint } from './silhouette.types';

export interface EyefitFace {
  gaze: Pose['gaze']
  split: number
  eyes: Pose['eyes']
}

export interface EyefitFootprint {
  x: number
  y: number
  ax: number
  ay: number
  r: number
  m: [number, number, number, number]
}

export interface EyefitTrial {
  footprints: EyefitFootprint[]
  reference: EyefitFootprint[]
  outline: SilhouettePoint[]
  referenceOutline: SilhouettePoint[]
}

export interface EyefitOffset {
  x: number
  y: number
}
