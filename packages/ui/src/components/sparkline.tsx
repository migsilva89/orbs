import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { ARTIFACTS } from '../services/artifacts/artifacts.constants';
import { chartAmount } from '../services/chart/chart.utils';
import { SPARKLINE } from '../services/sparkline/sparkline.constants';
import {
  sparklineChunks,
  sparklineCurve,
  sparklineFormat,
  sparklineGeometry,
  sparklineIsNumeric,
  sparklineMorph,
  sparklineTipAt,
} from '../services/sparkline/sparkline.utils';
import { TEXT_SWAP } from '../services/text-swap/text-swap.constants';
import type { KeyboardEvent, PointerEvent } from 'react';

interface SparklineProps {
  data: number[]
  label?: string
  value?: string
  change?: string
}

interface SparklineRollProps {
  text: string
  isReduced: boolean
  direction?: number
  isWhole?: boolean
  isMorph?: boolean
  tone?: string
}

function SparklineRoll({ text, isReduced, direction, isWhole = false, isMorph = false, tone }: SparklineRollProps) {
  const sizerRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | 'auto'>('auto');
  const [shown, setShown] = useState({ text, direction: 1 });

  if (shown.text !== text) {
    setShown({ text, direction: direction ?? (chartAmount(text) < chartAmount(shown.text) ? -1 : 1) });
  }

  useEffect(() => {
    const node = sizerRef.current;

    if (!node) {
      return;
    }

    let measured: string | null = null;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.inlineSize ?? node.offsetWidth;

      if (measured !== null && measured !== node.textContent && !isReduced) {
        animate(width, next, SPARKLINE.spring.morph);
      } else {
        width.jump(next);
      }

      measured = node.textContent;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMorph, isReduced, width]);

  const isNumeric = !isWhole && sparklineIsNumeric(text);
  const variants = isReduced ? TEXT_SWAP.fade : TEXT_SWAP.rise;
  const anchor = isNumeric ? 'right' : 'left';
  const piece = cn('relative inline-block whitespace-pre', isWhole && 'max-w-full overflow-hidden align-top text-ellipsis');

  return (
    <motion.span
      className={cn('relative inline-flex max-w-full overflow-x-clip align-top whitespace-pre', isNumeric && 'justify-end')}
      style={isMorph ? { width } : undefined}
    >
      {isMorph ? (
        <span aria-hidden className="pointer-events-none invisible absolute top-0 left-0 whitespace-pre" ref={sizerRef}>
          {text}
        </span>
      ) : null}
      <span className={piece}>
        <AnimatePresence anchorX={anchor} custom={shown.direction} initial={false} mode="popLayout">
          {sparklineChunks(text, isWhole).map((chunk) => (
            <motion.span animate="shown" className={piece} custom={shown.direction} exit="gone" initial="hidden" key={chunk.slot} variants={variants}>
              <AnimatePresence anchorX={anchor} custom={shown.direction} initial={false} mode="popLayout">
                <motion.span
                  animate="shown"
                  className={cn(piece, tone)}
                  custom={shown.direction}
                  exit="gone"
                  initial="hidden"
                  key={`${tone ?? ''}${chunk.key}`}
                  variants={variants}
                >
                  {chunk.text}
                </motion.span>
              </AnimatePresence>
            </motion.span>
          ))}
        </AnimatePresence>
      </span>
    </motion.span>
  );
}

export function Sparkline({ data, label, value, change }: SparklineProps) {
  const points = data.length > 1 ? data : [data[0] ?? 0, data[0] ?? 0];
  const last = points.length - 1;
  const key = points.join(',');
  const target = useMemo(() => sparklineCurve(key.split(',').map(Number)), [key]);
  const uid = `sparkline${useId().replaceAll(/[^\w-]/g, '')}`;
  const rootRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(rootRef, { once: true, amount: SPARKLINE.inView });
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);
  const [box, setBox] = useState<{ w: number, h: number }>({ w: SPARKLINE.width, h: SPARKLINE.height });
  const [active, setActive] = useState<number | null>(null);
  const [hasLanded, setHasLanded] = useState(false);
  const index = active === null ? null : Math.min(active, last);
  const [moved, setMoved] = useState({ index, direction: 1 });

  if (moved.index !== index) {
    setMoved({ index, direction: index === null || moved.index === null ? 1 : Math.sign(index - moved.index) || 1 });
  }

  const [first] = useState(() => sparklineGeometry(target, SPARKLINE.width, SPARKLINE.height, 1));
  const curveRef = useRef(target);
  const sizeRef = useRef(box);
  const drawn = useMotionValue(0);
  const cursor = useMotionValue(1);
  const line = useMotionValue(first.line);
  const trail = useMotionValue(first.trail);
  const fill = useMotionValue(first.fill);
  const dot = useMotionValue(first.dot);
  const cursorX = useMotionValue(first.cx);
  const lit = useMotionValue(first.cx + SPARKLINE.cap + SPARKLINE.lead);
  const dim = useMotionValue(first.cx + SPARKLINE.cap);
  const reveal = useMotionValue(0);
  const lineOpacity = useTransform(drawn, (progress) => (progress > 0.001 ? 1 : 0));

  const paint = useCallback(() => {
    const { w, h } = sizeRef.current;
    const progress = drawn.get();
    const next = sparklineGeometry(curveRef.current, w, h, cursor.get());
    line.set(next.line);
    trail.set(next.trail);
    fill.set(next.fill);
    dot.set(next.dot);
    cursorX.set(next.cx);
    lit.set(next.cx + SPARKLINE.cap + SPARKLINE.lead);
    dim.set(next.cx + SPARKLINE.cap);
    reveal.set(progress >= 1 ? w + SPARKLINE.lead * 2 : sparklineTipAt(next.points, progress) + SPARKLINE.lead);
  }, [cursor, cursorX, dim, dot, drawn, fill, line, lit, reveal, trail]);

  useMotionValueEvent(cursor, 'change', paint);
  useMotionValueEvent(drawn, 'change', paint);

  useLayoutEffect(() => {
    const node = plotRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver(() => {
      const w = node.clientWidth;

      if (w) {
        setBox((current) => (Math.abs(current.w - w) < 0.5 ? current : { w, h: (w * SPARKLINE.height) / SPARKLINE.width }));
      }
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    sizeRef.current = box;
    paint();
  }, [box, paint]);

  useEffect(() => {
    if (isReduced) {
      drawn.jump(1);
      const frame = requestAnimationFrame(() => setHasLanded(true));

      return () => cancelAnimationFrame(frame);
    }

    if (!isInView) {
      return;
    }

    const controls = animate(drawn, 1, { ...SPARKLINE.draw, onComplete: () => setHasLanded(true) });

    return () => controls.stop();
  }, [drawn, isInView, isReduced]);

  useEffect(() => {
    if (curveRef.current === target) {
      return;
    }

    if (isReduced) {
      curveRef.current = target;
      paint();

      return;
    }

    const curveAt = sparklineMorph(curveRef.current, target);

    const controls = animate(0, 1, {
      ...SPARKLINE.spring.smooth,
      onUpdate: (progress) => {
        curveRef.current = curveAt(progress);
        paint();
      },
      onComplete: () => {
        curveRef.current = target;
        paint();
      },
    });

    return () => controls.stop();
  }, [paint, isReduced, target]);

  useEffect(() => {
    const to = index === null ? 1 : index / last;

    if (isReduced) {
      cursor.jump(to);
      return;
    }

    const controls = animate(cursor, to, SPARKLINE.spring.snappy);

    return () => controls.stop();
  }, [cursor, index, last, isReduced]);

  const isScrubbing = index !== null;
  const at = index ?? last;
  const point = sparklineFormat(points[at]);
  const headline = value === undefined || !isScrubbing ? value : point;
  const scrubbed = value === undefined ? point : m.ui_sparkline_position({ index: at + 1, total: last + 1 });
  const aside = isScrubbing ? scrubbed : change ?? '';
  const readout = isScrubbing ? m.ui_sparkline_point({ index: at + 1, total: last + 1 }) : m.ui_sparkline_latest();
  const dotWidth = isScrubbing ? SPARKLINE.dot.active : SPARKLINE.dot.rest;
  const description = [label, value ?? sparklineFormat(points[last]), change].filter(Boolean).join(', ');
  const quick = isReduced ? { duration: 0 } : SPARKLINE.quick;

  const pointAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();

    return rect?.width ? Math.max(0, Math.min(last, Math.round(((clientX - rect.left) / rect.width) * last))) : last;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Escape' || !isScrubbing) {
      return;
    }

    event.preventDefault();
    setActive(null);
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' || event.buttons) {
      setActive(pointAt(event.clientX));
    }
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      setActive(null);
    }
  };

  return (
    <figure aria-label={description} className="m-0 grid min-w-0 gap-3" ref={rootRef} style={{ color: ARTIFACTS.chartColors[0] }}>
      <figcaption className="flex min-h-5 min-w-0 items-baseline gap-2 text-sm text-muted-foreground">
        {label ? (
          <span className="min-w-0 overflow-hidden whitespace-nowrap">
            <SparklineRoll isWhole isReduced={isReduced} text={label} />
          </span>
        ) : null}
        {headline === undefined ? null : (
          <strong className="ml-auto text-lg font-medium tracking-[-0.01em] text-foreground tabular-nums">
            <SparklineRoll isMorph isReduced={isReduced} text={headline} />
          </strong>
        )}
        <small className="flex-none text-xs font-medium text-foreground tabular-nums">
          <SparklineRoll
            isMorph
            direction={isScrubbing ? moved.direction : undefined}
            isReduced={isReduced}
            text={aside}
            tone={isScrubbing ? 'text-muted-foreground' : undefined}
          />
        </small>
      </figcaption>
      <div
        className={cn(
          'relative min-w-0 cursor-default touch-pan-y rounded-md select-none',
          'has-focus-visible:ring-1 has-focus-visible:ring-ring/50 has-focus-visible:ring-offset-8 has-focus-visible:ring-offset-transparent',
        )}
        ref={plotRef}
        onPointerCancel={() => setActive(null)}
        onPointerDown={(event) => setActive(pointAt(event.clientX))}
        onPointerLeave={() => setActive(null)}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <input
          aria-label={label ? m.ui_sparkline_explore_label({ label }) : m.ui_sparkline_explore()}
          aria-valuetext={m.ui_sparkline_value({ at: readout, value: point })}
          className="sr-only"
          max={last}
          min={0}
          step={1}
          type="range"
          value={at}
          onBlur={() => setActive(null)}
          onChange={(event) => setActive(Number(event.currentTarget.value))}
          onKeyDown={onKeyDown}
        />
        <svg aria-hidden className="block h-auto w-full overflow-visible" focusable="false" viewBox={`0 0 ${box.w} ${box.h}`}>
          <defs>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-lit`}>
              <motion.rect height={box.h + 32} width={lit} x={-16} y={-16} />
            </clipPath>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-dim`}>
              <motion.rect height={box.h + 32} width={box.w + 32} x={dim} y={-16} />
            </clipPath>
            <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-fill`}>
              <motion.rect height={box.h + 32} width={reveal} x={-16} y={-16} />
            </clipPath>
          </defs>
          <motion.path className="fill-[color-mix(in_oklab,currentColor_9%,transparent)] stroke-none" clipPath={`url(#${uid}-fill)`} d={fill} />
          <line className="stroke-border" strokeWidth={1} x1="0" x2={box.w} y1={box.h - 0.5} y2={box.h - 0.5} />
          {/* While scrubbing, the stretch after the cursor dims, as if the later points have not happened yet. */}
          <motion.path
            animate={{ opacity: isScrubbing && hasLanded ? 1 : 0 }}
            className="fill-none stroke-muted-foreground/40"
            clipPath={`url(#${uid}-dim)`}
            d={trail}
            initial={false}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            transition={quick}
          />
          <motion.polyline
            className="fill-none stroke-current"
            clipPath={`url(#${uid}-lit)`}
            points={line}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2.5}
            style={{ pathLength: drawn, opacity: lineOpacity }}
          />
          <motion.line
            animate={{ opacity: isScrubbing ? 1 : 0 }}
            className="stroke-muted-foreground/40"
            initial={false}
            strokeWidth={1}
            transition={quick}
            x1={cursorX}
            x2={cursorX}
            y1={0}
            y2={box.h}
          />
          {/* A zero-length round-capped stroke is a true circle in the line's colour. It rests on the latest point and becomes the scrub handle. */}
          <motion.polyline
            animate={{ opacity: hasLanded ? 1 : 0, strokeWidth: hasLanded ? dotWidth : 0 }}
            className="fill-none stroke-current"
            initial={false}
            points={dot}
            strokeLinecap="round"
            transition={isReduced ? { duration: 0 } : { opacity: SPARKLINE.quick, strokeWidth: SPARKLINE.spring.snappy }}
          />
        </svg>
      </div>
    </figure>
  );
}
