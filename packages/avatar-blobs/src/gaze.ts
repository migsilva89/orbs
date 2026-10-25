import type { EngineLook } from './types/engine.types';
import type { GazeAim } from './types/gaze.types';

const YAW_MAX = 16;
const PITCH_MAX = 13;

const PITCH = 10;

const TURN = 26;

const SPIN = 360;

export const TURN_TIME = 1.1;

export function lookTarget({ nx, ny, tour, pointer }: GazeAim): EngineLook {
  return {
    yaw: -TURN + nx * YAW_MAX,
    pitch: PITCH - ny * PITCH_MAX,
    mix: tour,
    spin: SPIN * (1 - tour),
    wander: pointer ? 0 : 1,
  };
}
