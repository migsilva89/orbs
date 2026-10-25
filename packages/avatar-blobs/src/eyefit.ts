import { EXPRESSIONS } from './expressions';
import { eyePoses } from './face';
import { clamp } from './math';
import { radiusAtAngle, toPoints } from './silhouette';
import { BODIES } from './skins';
import { STATES } from './states';
import type { ExpressionDef } from './types/expression.types';
import type * as EyefitTypes from './types/eyefit.types';
import type { Pose } from './types/pose.types';
import type { SilhouettePoint } from './types/silhouette.types';
import type { StateDef, StateId } from './types/state.types';

const R = 100;

const DRIFT_YAW = 5.5 + 1.6;
const DRIFT_PITCH = 4.2 + 1.3;
const DRIFT_X = 0.006;
const DRIFT_Y = 0.007;

function footprints(face: EyefitTypes.EyefitFace, sil: Pose['sil'], radii: number[]): EyefitTypes.EyefitFootprint[] {
  const out: EyefitTypes.EyefitFootprint[] = [];
  const poses = eyePoses(face.gaze, R, face.split);

  for (let i = 0; i < 2; i++) {
    const e = poses[i];

    if (e.depth <= 0.02) {
      continue;
    }

    const cfg = face.eyes[i];
    const phi = ((cfg.tilt ?? 0) * Math.PI) / 180;
    const cp = Math.cos(phi);
    const sp = Math.sin(phi);
    const ax = e.a * cp + e.c * sp;
    const ay = e.b * cp + e.d * sp;
    const cx = -e.a * sp + e.c * cp;
    const cy = -e.b * sp + e.d * cp;

    const hw = Math.max(cfg.w * R, 0.01) / 2;
    const hh = Math.max(cfg.h * R, 0.01) / 2;
    const r = Math.min(hw, hh);
    const long = hh > hw;
    const half = long ? hh - r : hw - r;
    const fit = radiusAtAngle(radii, Math.atan2(e.y, e.x) - sil.rot);
    out.push({
      x: e.x * fit,
      y: e.y * fit,
      ax: (long ? cx : ax) * half,
      ay: (long ? cy : ay) * half,
      r,
      m: [ax, ay, cx, cy],
    });
  }

  return out;
}

function nearest(pts: SilhouettePoint[], x0: number, y0: number, x1: number, y1: number) {
  const sx = x1 - x0;
  const sy = y1 - y0;
  const len2 = sx * sx + sy * sy;
  let best = Infinity;
  let vx = 0;
  let vy = 0;

  for (const p of pts) {
    const t = clamp(len2 > 0 ? ((p.x - x0) * sx + (p.y - y0) * sy) / len2 : 0);
    const ex = x0 + t * sx - p.x;
    const ey = y0 + t * sy - p.y;
    const d2 = ex * ex + ey * ey;

    if (d2 < best) {
      best = d2;
      vx = ex;
      vy = ey;
    }
  }

  const d = Math.sqrt(best);
  return { d, ux: d > 1e-9 ? vx / d : 0, uy: d > 1e-9 ? vy / d : 0 };
}

const FLOAT = Math.hypot(DRIFT_X, DRIFT_Y) * R;

function tightest(pts: SilhouettePoint[], prints: EyefitTypes.EyefitFootprint[], tx: number, ty: number) {
  let margin = Infinity;
  let ux = 0;
  let uy = 0;

  for (const e of prints) {
    const x = e.x + tx;
    const y = e.y + ty;
    const a = nearest(pts, x - e.ax, y - e.ay, x + e.ax, y + e.ay);
    const [m0, m1, m2, m3] = e.m;
    const radius = e.r * Math.hypot(m0 * a.ux + m1 * a.uy, m2 * a.ux + m3 * a.uy) + FLOAT;

    if (a.d - radius < margin) {
      margin = a.d - radius;
      ux = a.ux;
      uy = a.uy;
    }
  }

  return { margin, ux, uy };
}

const DIRECTIONS = 12;
const BISECTION_STEPS = 8;

function solve(trials: EyefitTypes.EyefitTrial[]): EyefitTypes.EyefitOffset {
  if (!trials.length) {
    return { x: 0, y: 0 };
  }

  const marginAt = (tx: number, ty: number) => {
    let m = Infinity;

    for (const trial of trials) {
      m = Math.min(m, tightest(trial.outline, trial.footprints, tx, ty).margin);
    }

    return m;
  };

  let required = Infinity;

  for (const trial of trials) {
    required = Math.min(required, tightest(trial.referenceOutline, trial.reference, 0, 0).margin);
  }

  let mx = 0;
  let my = 0;
  const prints = trials[0].footprints;

  for (const e of prints) {
    mx -= e.x / prints.length;
    my -= e.y / prints.length;
  }

  const reach = Math.max(0.35 * R, Math.hypot(mx, my) * 1.25);

  required = Math.min(required, marginAt(mx, my));

  const initial = marginAt(0, 0);

  if (initial >= required && initial >= 0) {
    return { x: 0, y: 0 };
  }

  const target = Math.max(required, 0);

  let bestX = 0;
  let bestY = 0;
  let bestNorm = Infinity;
  let fallbackX = 0;
  let fallbackY = 0;
  let fallback = initial;

  for (let d = 0; d < DIRECTIONS; d++) {
    const a = (d / DIRECTIONS) * Math.PI * 2;
    const ux = Math.cos(a);
    const uy = Math.sin(a);

    if (marginAt(ux * reach, uy * reach) < target) {
      for (const k of [0.3, 0.6, 1]) {
        const m = marginAt(ux * reach * k, uy * reach * k);

        if (m > fallback) {
          fallback = m;
          fallbackX = ux * reach * k;
          fallbackY = uy * reach * k;
        }
      }
      continue;
    }

    let low = 0;
    let high = reach;

    for (let i = 0; i < BISECTION_STEPS; i++) {
      const mid = (low + high) / 2;

      if (marginAt(ux * mid, uy * mid) >= target) {
        high = mid;
      } else {
        low = mid;
      }
    }

    if (high < bestNorm) {
      bestNorm = high;
      bestX = ux * high;
      bestY = uy * high;
    }
  }

  const x = bestNorm === Infinity ? fallbackX : bestX;
  const y = bestNorm === Infinity ? fallbackY : bestY;
  return { x: Number((x / R).toFixed(6)), y: Number((y / R).toFixed(6)) };
}

function faceOf(def: StateDef, pose: Pose, expr: ExpressionDef | null): EyefitTypes.EyefitFace {
  if (def.baseFace && expr) {
    return { gaze: expr.gaze, split: expr.split, eyes: expr.eyes };
  }
  return { gaze: pose.gaze, split: pose.split, eyes: pose.eyes };
}

function sampleTimes(def: StateDef): number[] {
  const signature = (p: Pose) => JSON.stringify([p.gaze, p.split, p.eyes, p.sil.rot, p.sil.cx, p.sil.cy, p.sil.sx, p.sil.sy]);

  if (signature(def.pose(0)) === signature(def.pose(def.duration))) {
    return [0];
  }

  const n = 3;
  return Array.from({ length: n }, (_, i) => (i / (n - 1)) * def.duration);
}

function offsetFor(def: StateDef, radii: number[], expr: ExpressionDef | null): EyefitTypes.EyefitOffset {
  const trials: EyefitTypes.EyefitTrial[] = [];

  for (const t of sampleTimes(def)) {
    const pose = def.pose(t);
    const outline = toPoints({ ...pose.sil, radii }, R);
    const referenceOutline = toPoints(pose.sil, R);
    const v = faceOf(def, pose, expr);
    const corners: EyefitTypes.EyefitFace[] = [];

    for (const dy of [-DRIFT_YAW, DRIFT_YAW]) {
      for (const dp of [-DRIFT_PITCH, DRIFT_PITCH]) {
        corners.push({
          ...v,
          gaze: { yaw: v.gaze.yaw + dy, pitch: v.gaze.pitch + dp, roll: v.gaze.roll },
        });
      }
    }

    for (const c of corners) {
      trials.push({
        footprints: footprints(c, pose.sil, radii),
        reference: footprints(c, pose.sil, pose.sil.radii),
        outline,
        referenceOutline,
      });
    }
  }

  return solve(trials);
}

const ZERO = { x: 0, y: 0 } as const;

const keyOf = (state: StateId, expr: string | null) => `${state}|${expr ?? ''}`;

const CATALOGUE = new Set(BODIES.map((body) => body.radii));
const OFFSETS = new Map<number[], Map<string, EyefitTypes.EyefitOffset>>();

export function eyeOffset(radii: number[] | null, state: StateId, expr: string | null): EyefitTypes.EyefitOffset {
  const def = STATES.find((candidate) => candidate.id === state);

  if (!radii || !CATALOGUE.has(radii) || !def?.baseBody) {
    return ZERO;
  }

  const face = def.baseFace ? EXPRESSIONS.find((candidate) => candidate.id === expr) ?? null : null;
  const key = keyOf(def.id, face?.id ?? null);
  const byKey = OFFSETS.get(radii) ?? new Map<string, EyefitTypes.EyefitOffset>();
  const offset = byKey.get(key) ?? offsetFor(def, radii, face);
  byKey.set(key, offset);
  OFFSETS.set(radii, byKey);

  return offset;
}
