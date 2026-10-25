import type { Pose } from './pose.types';

export type StateId
  = | 'idle'
    | 'thinking'
    | 'wink'
    | 'wide'
    | 'alert'
    | 'notify'
    | 'exclaim'
    | 'sleep'
    | 'egg'
    | 'hexagon'
    | 'play'
    | 'orbit'
    | 'burst'
    | 'comet'
    | 'swirl';

export interface StateDef {
  id: StateId
  duration: number
  minDuration?: number
  morph: number
  blinkIn: boolean
  baseBody: boolean
  baseFace: boolean
  pose: (local: number) => Pose
}
