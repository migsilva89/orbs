import type { DecorArcSpec, DecorDotRender } from './decor.types';
import type { FaceHeadGaze } from './face.types';
import type { Silhouette } from './silhouette.types';

export interface PoseEye {
  w: number
  h: number
  open: number
  tilt?: number
}

export interface Pose {
  sil: Silhouette
  offX: number
  offY: number
  gaze: FaceHeadGaze
  split: number
  eyes: [PoseEye, PoseEye]
  eyeAlpha: number
  bodyAlpha: number
  dots: DecorDotRender[]
  arcs: DecorArcSpec[]
  notif: { x: number; y: number; r: number; notch: number } | null
  dotsBehind: boolean
}
