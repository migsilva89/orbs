import { NOTIF_BLUE } from './decor';
import { BotEngine } from './engine';
import { lookTarget, TURN_TIME } from './gaze';
import { clamp, easings } from './math';
import { mixHex } from './skins';
import { POSES, stateDef } from './states';
import { HALF_VIEWBOX, RADIUS } from './viewbox';
import type { AvatarAttrs, AvatarLook, AvatarSvgNode } from './types/avatar.types';
import type { DecorArcRender } from './types/decor.types';
import type { EngineFrame } from './types/engine.types';

export type { AvatarSvgNode } from './types/avatar.types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const PAPER = '#f9f9f9';
const BOX = HALF_VIEWBOX * 2;
const FRAME_BOX = { x: -HALF_VIEWBOX, y: -HALF_VIEWBOX, width: BOX, height: BOX };
const ARC_GROUP = { fill: 'none', 'stroke-linecap': 'round' };

function svgNode(tag: string, attrs: AvatarAttrs = {}, children: AvatarSvgNode[] = []): AvatarSvgNode {
  return { tag, attrs, children };
}

export function avatarSvg(frame: EngineFrame, ink: string, uid: string): AvatarSvgNode[] {
  const maskId = `${uid}-mask`;
  const stroke = (arc: DecorArcRender): AvatarAttrs => ({ stroke: `url(#${uid}-${arc.id})`, 'stroke-width': arc.width, opacity: arc.opacity });

  const mask = svgNode('mask', {
    id: maskId,
    maskUnits: 'userSpaceOnUse',
    ...FRAME_BOX,
  }, [
    svgNode('path', { fill: '#fff', d: frame.bodyPath }),
    ...frame.eyes.map((eye) => svgNode('path', {
      d: eye.d,
      transform: eye.matrix,
      opacity: eye.alpha,
      fill: '#000',
    })),
    ...(frame.notch ? [svgNode('circle', {
      fill: '#000',
      cx: frame.notch.x,
      cy: frame.notch.y,
      r: frame.notch.r,
    })] : []),
  ]);

  const gradients = frame.arcs.map((arc) => svgNode(
    'linearGradient',
    {
      id: `${uid}-${arc.id}`,
      gradientUnits: 'userSpaceOnUse',
      x1: arc.grad.x1,
      y1: arc.grad.y1,
      x2: arc.grad.x2,
      y2: arc.grad.y2,
    },
    arc.grad.stops.map((color, stop) => svgNode('stop', { offset: stop / (arc.grad.stops.length - 1), 'stop-color': color })),
  ));

  const dots = svgNode('g', {}, frame.dots.map((dot) => {
    const fill = dot.color ?? (dot.depth === undefined ? ink : mixHex(PAPER, ink, dot.depth));
    const placed: AvatarAttrs = dot.d ? { d: dot.d, transform: `translate(${dot.x} ${dot.y}) rotate(${dot.rot ?? 0}) scale(${RADIUS})` } : { cx: dot.x, cy: dot.y, r: dot.r };

    return svgNode(dot.d ? 'path' : 'circle', {
      fill,
      opacity: dot.opacity,
      ...placed,
    });
  }));

  const body = svgNode('g', { opacity: frame.bodyAlpha }, [
    svgNode('g', { mask: `url(#${maskId})` }, [svgNode('rect', { ...FRAME_BOX, fill: ink })]),
  ]);

  return [
    svgNode('defs', {}, [mask, ...gradients]),
    svgNode('g', ARC_GROUP, frame.arcs.map((arc) => svgNode('path', { d: arc.back, ...stroke(arc) }))),
    ...(frame.dotsBehind ? [dots, body] : [body, dots]),
    ...(frame.notif ? [svgNode('circle', {
      fill: NOTIF_BLUE,
      cx: frame.notif.x,
      cy: frame.notif.y,
      r: frame.notif.r,
    })] : []),
    svgNode('g', ARC_GROUP, frame.arcs.map((arc) => svgNode('path', { d: arc.front, ...stroke(arc) }))),
  ];
}

export function avatarMarkup(node: AvatarSvgNode): string {
  const attrs = Object.entries(node.attrs).map(([key, value]) => `${key}="${value}"`).join(' ');

  return `<${node.tag} ${attrs}>${node.children.map(avatarMarkup).join('')}</${node.tag}>`;
}

export function avatarStill(look: Pick<AvatarLook, 'state' | 'radii' | 'expression'>): EngineFrame {
  return new BotEngine(RADIUS, look.state, look.radii, look.expression).sample(POSES[look.state]);
}

function syncAttrs(node: Element, attrs: AvatarAttrs) {
  for (const [name, value] of Object.entries(attrs)) {
    const text = String(value);

    if (node.getAttribute(name) !== text) {
      node.setAttribute(name, text);
    }
  }

  for (const name of node.getAttributeNames()) {
    if (!(name in attrs)) {
      node.removeAttribute(name);
    }
  }
}

function syncChildren(parent: Element, nodes: AvatarSvgNode[]) {
  for (const [index, node] of nodes.entries()) {
    let current = parent.children.item(index);

    if (current?.tagName !== node.tag) {
      const next = document.createElementNS(SVG_NS, node.tag);

      if (current) {
        current.replaceWith(next);
      } else {
        parent.appendChild(next);
      }

      current = next;
    }

    syncAttrs(current, node.attrs);
    syncChildren(current, node.children);
  }

  while (parent.children.length > nodes.length) {
    parent.lastElementChild?.remove();
  }
}

export class AvatarPlayer {
  private readonly svg: SVGSVGElement;
  private readonly uid: string;
  private engine: BotEngine | null = null;
  private look: AvatarLook | null = null;
  private clock = 0;
  private raf = 0;
  private last = 0;
  private drawn = -Infinity;
  private follow = false;
  private onscreen = true;
  private pointer: { x: number; y: number } | null = null;
  private aiming = false;
  private turnSince = 0;
  private readonly observer = new IntersectionObserver((entries) => {
    this.onscreen = entries.at(-1)?.isIntersecting ?? this.onscreen;
    this.wake();
  });

  constructor(svg: SVGSVGElement, uid: string) {
    this.svg = svg;
    this.uid = uid;
    this.observer.observe(svg);
    document.addEventListener('visibilitychange', this.wake);
  }

  update(look: AvatarLook) {
    this.look = look;
    this.engine ??= new BotEngine(RADIUS, look.state, look.radii, look.expression);
    this.engine.setState(look.state, this.clock);
    this.engine.setBody(look.radii, this.clock);
    this.engine.setExpression(look.expression, this.clock);
    this.draw();
  }

  setFollow(follow: boolean) {
    this.follow = follow;

    if (this.follow) {
      window.addEventListener('pointermove', this.onPointerMove);
      document.addEventListener('pointerleave', this.onPointerLeave);
    } else {
      this.unfollow();
    }

    this.wake();
  }

  destroy() {
    this.halt();
    this.unfollow();
    this.observer.disconnect();
    document.removeEventListener('visibilitychange', this.wake);
  }

  private draw() {
    if (!this.engine || !this.look) {
      return;
    }

    syncChildren(this.svg, avatarSvg(this.engine.sample(this.clock), this.look.ink, this.uid));
  }

  private wake = () => {
    if (this.onscreen && document.visibilityState !== 'hidden') {
      this.run();
    } else {
      this.halt();
    }
  };

  private run() {
    if (this.raf) {
      return;
    }

    this.last = 0;
    this.raf = requestAnimationFrame(this.tick);
  }

  private halt() {
    cancelAnimationFrame(this.raf);
    this.raf = 0;
  }

  private tick = (ms: number) => {
    this.raf = requestAnimationFrame(this.tick);
    const dt = this.last ? Math.min((ms - this.last) / 1000, 0.064) : 0;
    this.last = ms;
    this.clock += dt;
    const fps = this.look?.fps ?? 0;

    if (this.clock - this.drawn < (fps > 0 ? 1 / fps : 0)) {
      return;
    }

    this.drawn = this.clock;

    if (this.follow) {
      this.aim();
    }

    this.draw();
  };

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') {
      this.pointer = { x: event.clientX, y: event.clientY };
    }
  };

  private onPointerLeave = () => {
    this.pointer = null;
  };

  private unfollow() {
    window.removeEventListener('pointermove', this.onPointerMove);
    document.removeEventListener('pointerleave', this.onPointerLeave);
    this.release();
  }

  private release() {
    if (!this.aiming) {
      return;
    }

    this.engine?.setLook(null, this.clock, TURN_TIME);
    this.aiming = false;
  }

  private aim() {
    if (!this.engine || !stateDef(this.engine.state).baseFace) {
      this.release();
      return;
    }

    const box = this.svg.getBoundingClientRect();

    if (box.width === 0 || box.height === 0) {
      return;
    }

    if (!this.aiming) {
      this.turnSince = this.clock;
    }

    const halfWidth = Math.max(1, window.innerWidth / 2);
    const halfHeight = Math.max(1, window.innerHeight / 2);
    this.engine.setLook(
      lookTarget({
        nx: this.pointer ? clamp((this.pointer.x - (box.left + box.width / 2)) / halfWidth, -1, 1) : 0,
        ny: this.pointer ? clamp((this.pointer.y - (box.top + box.height / 2)) / halfHeight, -1, 1) : 0,
        tour: easings.easeOutQuint(clamp((this.clock - this.turnSince) / TURN_TIME)),
        pointer: this.pointer !== null,
      }),
      this.clock,
    );
    this.aiming = true;
  }
}
