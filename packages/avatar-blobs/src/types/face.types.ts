export type FaceVec3 = [number, number, number];

export interface FaceHeadGaze {
  yaw: number
  pitch: number
  roll: number
}

export interface FaceEyePose {
  x: number
  y: number
  a: number
  b: number
  c: number
  d: number
  depth: number
}

export interface FaceLiveliness {
  dYaw: number
  dPitch: number
  dRoll: number
  lid: number
  driftX: number
  driftY: number
  breath: number
}

export interface FaceLivelinessOptions {
  wander?: number
  blink?: boolean
  float?: boolean
}
