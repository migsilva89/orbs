import type { ExpressionDef } from './expression.types';
import type { StateId } from './state.types';

export type AvatarAttrs = Record<string, string | number>;

export interface AvatarSvgNode {
  tag: string
  attrs: AvatarAttrs
  children: AvatarSvgNode[]
}

export interface AvatarLook {
  state: StateId
  radii: number[] | null
  expression: ExpressionDef | null
  ink: string
  fps: number
}
