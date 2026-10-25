export type BodyId = 'circle' | 'pebble' | 'squircle' | 'capsule' | 'triangle' | 'hexagon' | 'cloud' | 'droplet';

export interface BodyDef {
  id: BodyId
  radii: number[]
}
