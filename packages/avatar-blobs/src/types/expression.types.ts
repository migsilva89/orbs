import type { FaceHeadGaze } from './face.types';
import type { PoseEye } from './pose.types';

export type ExpressionId
  = | 'neutral'
    | 'attentive'
    | 'surprised'
    | 'excited'
    | 'happy'
    | 'laughing'
    | 'angry'
    | 'sad'
    | 'scared'
    | 'suspicious'
    | 'confused'
    | 'curious'
    | 'proud'
    | 'shy'
    | 'bored'
    | 'sleepy';

export interface ExpressionDef {
  id: ExpressionId
  gaze: FaceHeadGaze
  split: number
  eyes: [PoseEye, PoseEye]
}
