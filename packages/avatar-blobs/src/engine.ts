import { arcRender } from './decor';
import { blendExpression } from './expressions';
import { eyeOffset } from './eyefit';
import { blinkScale, eyePoses, liveliness } from './face';
import { clamp, easings, lerp, r2 } from './math';
import { blend, capsulePath, closedPath, radiusAtAngle, toPoints } from './silhouette';
import { stateDef } from './states';
import type { EngineFrame, EngineLook, EngineRenderedEye } from './types/engine.types';
import type { ExpressionDef } from './types/expression.types';
import type { Pose } from './types/pose.types';
import type { Silhouette, SilhouettePoint } from './types/silhouette.types';
import type { StateDef, StateId } from './types/state.types';

const NO_LOOK: EngineLook = { yaw: 0, pitch: 0, mix: 0, spin: 0, wander: 1 };

const lerpLook = (a: EngineLook, b: EngineLook, t: number): EngineLook => ({
  yaw: lerp(a.yaw, b.yaw, t),
  pitch: lerp(a.pitch, b.pitch, t),
  mix: lerp(a.mix, b.mix, t),
  spin: lerp(a.spin, b.spin, t),
  wander: lerp(a.wander, b.wander, t),
});

const lerpEye = (a: Pose['eyes'][number], b: Pose['eyes'][number], t: number) => ({
  w: lerp(a.w, b.w, t),
  h: lerp(a.h, b.h, t),
  open: lerp(a.open, b.open, t),
  tilt: lerp(a.tilt ?? 0, b.tilt ?? 0, t),
});

function blendPose(a: Pose, b: Pose, t: number): Pose {
  const out = 1 - t;
  return {
    sil: blend(a.sil, b.sil, t),
    offX: lerp(a.offX, b.offX, t),
    offY: lerp(a.offY, b.offY, t),
    gaze: {
      yaw: lerp(a.gaze.yaw, b.gaze.yaw, t),
      pitch: lerp(a.gaze.pitch, b.gaze.pitch, t),
      roll: lerp(a.gaze.roll, b.gaze.roll, t),
    },
    split: lerp(a.split, b.split, t),
    eyes: [lerpEye(a.eyes[0], b.eyes[0], t), lerpEye(a.eyes[1], b.eyes[1], t)],
    eyeAlpha: lerp(a.eyeAlpha, b.eyeAlpha, t),
    bodyAlpha: lerp(a.bodyAlpha, b.bodyAlpha, t),
    dots: [...a.dots.map((d) => ({ ...d, opacity: d.opacity * out })), ...b.dots.map((d) => ({ ...d, opacity: d.opacity * t }))],
    arcs: [
      ...a.arcs.map((r) => ({ ...r, id: `a${r.id}`, opacity: r.opacity * out })),
      ...b.arcs.map((r) => ({ ...r, id: `b${r.id}`, opacity: r.opacity * t })),
    ],
    notif: t < 0.5 ? a.notif : b.notif,
    dotsBehind: t < 0.5 ? a.dotsBehind : b.dotsBehind,
  };
}

export class BotEngine {
  readonly scale: number;

  private cur: StateId;
  private prev: StateId | null = null;
  private frozenOrigin: Pose | null = null;
  private tCur = 0;
  private tPrev = 0;
  private posePhase = 0;
  private previousPosePhase = 0;
  private blinkAt = -10;
  private pts: SilhouettePoint[] = [];
  private body: number[] | null = null;
  private bodyPrev: number[] | null = null;
  private bodyAt = -10;
  private expr: ExpressionDef | null = null;
  private exprPrev: ExpressionDef | null = null;
  private exprAt = -10;
  private look: EngineLook = NO_LOOK;
  private lookPrev: EngineLook = NO_LOOK;
  private lookAt = -10;
  private lookMorph = 0.24;

  static readonly BODY_MORPH = 0.45;

  static readonly LOOK_MORPH = 0.24;

  constructor(scale = 100, initial: StateId = 'idle', body: number[] | null = null, expression: ExpressionDef | null = null) {
    this.scale = scale;
    this.cur = initial;
    this.body = body;
    this.expr = expression;
  }

  setExpression(expression: ExpressionDef | null, now = 0) {
    if (expression === this.expr) {
      return;
    }
    this.exprPrev = this.expr;
    this.expr = expression;
    this.exprAt = now;
  }

  private exprAtTime(now: number): ExpressionDef | null {
    const to = this.expr;
    const from = this.exprPrev;

    if (!to || !from) {
      return to;
    }

    const k = (now - this.exprAt) / BotEngine.BODY_MORPH;

    if (k >= 1) {
      return to;
    }

    return blendExpression(from, to, easings.easeOutQuint(clamp(k)));
  }

  setBody(radii: number[] | null, now = 0) {
    if (radii === this.body) {
      return;
    }
    this.bodyPrev = this.body;
    this.body = radii;
    this.bodyAt = now;
  }

  private bodyAtTime(now: number): number[] | null {
    const to = this.body;
    const from = this.bodyPrev;

    if (!to || !from) {
      return to;
    }

    const k = (now - this.bodyAt) / BotEngine.BODY_MORPH;

    if (k >= 1) {
      return to;
    }

    const t = easings.easeOutQuint(clamp(k));
    return to.map((r, i) => lerp(from[i] ?? r, r, t));
  }

  setLook(look: EngineLook | null, now: number, morph = BotEngine.LOOK_MORPH) {
    if (look && !Number.isFinite(look.yaw + look.pitch + look.mix + look.spin + look.wander)) {
      return;
    }
    this.lookPrev = this.lookAtTime(now);
    this.look = look ?? NO_LOOK;
    this.lookAt = now;
    this.lookMorph = morph;
  }

  private lookAtTime(now: number): EngineLook {
    const k = (now - this.lookAt) / this.lookMorph;

    if (k >= 1) {
      return this.look;
    }

    return lerpLook(this.lookPrev, this.look, easings.easeOutQuint(clamp(k)));
  }

  private posed(def: StateDef, t: number, body: number[] | null, expr: ExpressionDef | null): Pose {
    let pose = def.pose(t);

    if (def.baseBody && body) {
      pose = { ...pose, sil: { ...pose.sil, radii: body } };
    }

    if (def.baseFace && expr) {
      pose = { ...pose, gaze: expr.gaze, split: expr.split, eyes: expr.eyes };
    }

    return pose;
  }

  private eyeOffsetAtTime(now: number, state: StateId): { x: number; y: number } {
    const alongAxis = (start: number, duration: number, a: { x: number; y: number }, b: { x: number; y: number }) => {
      if (a === b) {
        return b;
      }

      const k = (now - start) / duration;

      if (k >= 1) {
        return b;
      }

      const t = easings.easeOutQuint(clamp(k));
      return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
    };

    const perBody = (radii: number[] | null) =>
      alongAxis(this.exprAt, BotEngine.BODY_MORPH, eyeOffset(radii, state, this.exprPrev?.id ?? null), eyeOffset(radii, state, this.expr?.id ?? null));

    return alongAxis(this.bodyAt, BotEngine.BODY_MORPH, perBody(this.bodyPrev), perBody(this.body));
  }

  get state(): StateId {
    return this.cur;
  }

  reset(id: StateId, now: number) {
    this.cur = id;
    this.prev = null;
    this.frozenOrigin = null;
    this.tCur = now;
    this.tPrev = now;
    this.posePhase = 0;
    this.previousPosePhase = 0;
    this.blinkAt = -10;
  }

  private origin(now: number, body: number[] | null, expr: ExpressionDef | null): Pose | null {
    if (this.frozenOrigin) {
      return this.frozenOrigin;
    }

    if (!this.prev) {
      return null;
    }

    return this.posed(stateDef(this.prev), Math.max(0, now - this.tPrev + this.previousPosePhase), body, expr);
  }

  private composedPose(now: number): Pose {
    const def = stateDef(this.cur);
    const body = this.bodyAtTime(now);
    const expr = this.exprAtTime(now);
    const pose = this.posed(def, Math.max(0, now - this.tCur + this.posePhase), body, expr);
    const since = now - this.tCur;

    if (since >= def.morph) {
      return pose;
    }

    const origin = this.origin(now, body, expr);

    if (!origin) {
      return pose;
    }

    return blendPose(origin, pose, easings.easeOutQuint(clamp(since / def.morph)));
  }

  setState(id: StateId, now: number, posePhase = 0) {
    if (id === this.cur) {
      return;
    }

    const { morph } = stateDef(this.cur);
    const midFade = this.prev !== null && now - this.tCur < morph;
    this.frozenOrigin = midFade ? this.composedPose(now) : null;
    this.prev = this.cur;
    this.tPrev = this.tCur;
    this.previousPosePhase = this.posePhase;
    this.posePhase = posePhase;
    this.cur = id;
    this.tCur = now;
    if (stateDef(id).blinkIn) {
      this.blinkAt = now;
    }
  }

  sample(now: number): EngineFrame {
    const R = this.scale;
    const def = stateDef(this.cur);
    const body = this.bodyAtTime(now);
    const expr = this.exprAtTime(now);
    let pose = this.posed(def, Math.max(0, now - this.tCur + this.posePhase), body, expr);
    let offset = this.eyeOffsetAtTime(now, this.cur);

    const since = now - this.tCur;
    const origin = since < def.morph ? this.origin(now, body, expr) : null;

    if (origin) {
      const ratio = easings.easeOutQuint(clamp(since / def.morph));
      pose = blendPose(origin, pose, ratio);
      const left = this.prev;

      if (left) {
        const before = this.eyeOffsetAtTime(now, left);
        offset = {
          x: lerp(before.x, offset.x, ratio),
          y: lerp(before.y, offset.y, ratio),
        };
      }
    }

    const alive = pose.eyeAlpha > 0.01;
    const look = this.lookAtTime(now);
    const life = liveliness(now, { wander: alive ? look.wander : 0, blink: alive });

    const gaze = {
      yaw: lerp(pose.gaze.yaw, look.yaw, look.mix) + life.dYaw - look.spin,
      pitch: lerp(pose.gaze.pitch, look.pitch, look.mix) + life.dPitch,
      roll: pose.gaze.roll + life.dRoll,
    };

    const forced = clamp((now - this.blinkAt) / 0.2);
    const forcedLid = forced < 1 ? Math.abs(forced * 2 - 1) : 1;
    const lid = Math.min(life.lid, forcedLid);

    const offX = pose.offX + life.driftX;
    const offY = pose.offY + life.driftY;

    const sil: Silhouette = {
      ...pose.sil,
      cx: pose.sil.cx + offX,
      cy: pose.sil.cy + offY,
      sy: pose.sil.sy * life.breath,
    };

    const bodyPath = closedPath(toPoints(sil, R, this.pts));

    const bodyRadius = (x: number, y: number) => radiusAtAngle(pose.sil.radii, Math.atan2(y, x) - pose.sil.rot);

    const eyes: EngineRenderedEye[] = [];

    if (pose.eyeAlpha > 0.01) {
      const poses = eyePoses(gaze, R, pose.split);

      for (let i = 0; i < 2; i++) {
        const e = poses[i];

        if (e.depth <= 0.02) {
          continue;
        }

        const cfg = pose.eyes[i];
        const fit = bodyRadius(e.x, e.y);
        const phi = ((cfg.tilt ?? 0) * Math.PI) / 180;
        const cp = Math.cos(phi);
        const sp = Math.sin(phi);
        const ax = e.a * cp + e.c * sp;
        const ay = e.b * cp + e.d * sp;
        const cx2 = -e.a * sp + e.c * cp;
        const cy2 = -e.b * sp + e.d * cp;
        const k = blinkScale(Math.min(lid, cfg.open));
        eyes.push({
          d: capsulePath(cfg.w * R, cfg.h * R),
          matrix: `matrix(${r2(ax)},${r2(ay * k)},${r2(cx2)},${r2(cy2 * k)},${r2(e.x * fit + (offX + offset.x) * R)},${r2(e.y * fit + (offY + offset.y) * R)})`,
          alpha: pose.eyeAlpha * clamp(e.depth / 0.12),
        });
      }
    }

    const dots = pose.dots.filter((p) => p.opacity > 0.01 && p.r > 0.0005).map((p) => ({ ...p, x: (p.x + offX) * R, y: (p.y + offY) * R, r: p.r * R }));

    const nFit = pose.notif ? bodyRadius(pose.notif.x, pose.notif.y) : 1;
    const nx = pose.notif ? (pose.notif.x * nFit + offX) * R : 0;
    const ny = pose.notif ? (pose.notif.y * nFit + offY) * R : 0;
    const notif = pose.notif ? { x: nx, y: ny, r: pose.notif.r * R } : null;
    const notch = pose.notif ? { x: nx, y: ny, r: pose.notif.notch * R } : null;

    return {
      bodyPath,
      bodyAlpha: pose.bodyAlpha,
      eyes,
      dots,
      dotsBehind: pose.dotsBehind,
      arcs: pose.arcs.filter((a) => a.opacity > 0.01).map((a) => arcRender(a.seed, a.t, R, a.id, a.opacity)),
      notif,
      notch,
    };
  }
}
