import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { animate, cancelFrame, frame, motionValue, useInView, useMotionValue, useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-m';
import { useCallback, useEffect, useEffectEvent, useId, useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { cn } from '../lib/cn';
import { ARTIFACTS } from '../services/artifacts/artifacts.constants';
import { chartSpring } from '../services/chart/chart.utils';
import { DONUT_CHART } from '../services/donut-chart/donut-chart.constants';
import {
  donutChartBreadth,
  donutChartLayout,
  donutChartRound,
  donutChartSector,
  donutChartShare,
  donutChartTurn,
  donutChartValue,
} from '../services/donut-chart/donut-chart.utils';
import type * as DonutChartTypes from '../types/donut-chart.types';
import type { FocusEvent, KeyboardEvent, PointerEvent } from 'react';

interface DonutChartProps {
  data: DonutChartTypes.DonutChartDatum[]
  title?: string
  centerLabel?: string
  caption?: string
}

interface DonutChartCountProps {
  value: number
  format: (value: number) => string
  isReduced: boolean
}

const center = DONUT_CHART.size / 2;
const outer = center - DONUT_CHART.margin;
const inner = Math.max(8, outer - DONUT_CHART.thickness);
const corner = Math.min(DONUT_CHART.corner, DONUT_CHART.thickness / 4);

function DonutChartCount({ value, format, isReduced }: DonutChartCountProps) {
  const node = useRef<HTMLSpanElement>(null);
  const [initial] = useState(() => format(value));
  const count = useMotionValue(value);

  useEffect(() => count.on('change', (now) => {
    if (node.current) {
      node.current.textContent = format(Number.isInteger(value) ? Math.round(now) : now);
    }
  }), [count, format, value]);

  useEffect(() => {
    if (isReduced) {
      count.jump(value);

      if (node.current) {
        node.current.textContent = format(value);
      }

      return;
    }

    const controls = animate(count, value, chartSpring(DONUT_CHART.motion.count, Math.max(Math.abs(value - count.get()) * 0.001, 1e-6)));

    return () => controls.stop();
  }, [count, format, isReduced, value]);

  return <span ref={node}>{initial}</span>;
}

export function DonutChart({ data, title, centerLabel, caption }: DonutChartProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);

  const uid = useId();
  const figureRef = useRef<HTMLElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const isInView = useInView(figureRef, { once: true, amount: 0.35 });
  const isShown = isInView || isReduced;
  const [preview, setPreview] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const rowsRef = useRef<(HTMLButtonElement | null)[]>([]);

  const slices: DonutChartTypes.DonutChartSlice[] = data.map((item, index) => {
    const repeat = data.slice(0, index).filter((prior) => prior.label === item.label).length;

    return {
      label: item.label,
      value: Math.max(0, item.value),
      key: repeat ? `${item.label}#${repeat}` : item.label,
      color: ARTIFACTS.chartColors[index % ARTIFACTS.chartColors.length],
    };
  });

  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const signature = slices.map((item) => `${item.key}:${item.value}`).join('|');
  const current = [preview, selected].find((key) => key !== null && slices.some((item) => item.key === key)) ?? null;
  const name = title ?? m.ui_donut_chart_label();

  const segments = useRef(new Map<string, DonutChartTypes.DonutChartSegment>());
  const paths = useRef(new Map<string, SVGPathElement>());
  const targets = useRef(new Map<string, DonutChartTypes.DonutChartArc>());

  const registerPath = useCallback((node: SVGPathElement | null) => {
    const key = node?.dataset.key;

    if (!node || !key) {
      return;
    }

    paths.current.set(key, node);

    return () => {
      if (paths.current.get(key) === node) {
        paths.current.delete(key);
      }
    };
  }, []);

  const paint = useCallback(() => {
    paths.current.forEach((node, key) => {
      const segment = segments.current.get(key);

      if (!segment) {
        node.setAttribute('d', '');
        return;
      }

      const start = segment.start.get();
      const end = segment.end.get();
      const lift = Math.max(0, segment.lift.get());
      const R = outer + lift * DONUT_CHART.grow;
      const middle = ((start + end) / 2) * DONUT_CHART.tau - Math.PI / 2;
      const distance = lift * DONUT_CHART.lift;

      node.setAttribute('d', donutChartSector(center, R, inner - lift * DONUT_CHART.grow * 0.5, start, end, corner));
      node.setAttribute('fill-opacity', donutChartRound(Math.min(1, Math.max(0, (donutChartBreadth(R, start, end) - 1) / 3))));
      node.setAttribute('transform', `translate(${donutChartRound(Math.cos(middle) * distance)} ${donutChartRound(Math.sin(middle) * distance)})`);
    });
  }, []);

  const schedule = useCallback(() => {
    frame.render(paint);
  }, [paint]);

  useLayoutEffect(() => {
    paint();
  });

  useEffect(() => {
    const live = segments.current;

    return () => {
      cancelFrame(paint);
      live.forEach((segment) => segment.off());
      live.clear();
    };
  }, [paint]);

  const sync = useEffectEvent(() => {
    const goal = donutChartLayout(slices);
    const isFirst = segments.current.size === 0;

    targets.current = goal;

    [...segments.current.keys()].filter((key) => !goal.has(key)).forEach((key) => {
      segments.current.get(key)?.off();
      segments.current.delete(key);
    });

    slices.forEach((item, index) => {
      const to = goal.get(item.key) ?? { start: 0, end: 0 };
      const existing = segments.current.get(item.key);
      const prior = slices.slice(0, index).reverse().map((entry) => segments.current.get(entry.key)).find(Boolean);
      const from = isFirst ? 0 : prior?.end.get() ?? 0;

      const segment = existing ?? (() => {
        const start = motionValue(from);
        const end = motionValue(from);
        const lift = motionValue(0);
        const offs = [start.on('change', schedule), end.on('change', schedule), lift.on('change', schedule)];

        const created = {
          start,
          end,
          lift,
          off: () => {
            offs.forEach((off) => off());
            [start, end, lift].forEach((value) => value.destroy());
          },
        };

        segments.current.set(item.key, created);

        return created;
      })();

      if (isReduced) {
        segment.start.jump(to.start);
        segment.end.jump(to.end);

        return;
      }

      if (isFirst) {
        animate(segment.start, to.start, chartSpring(DONUT_CHART.motion.reveal, 0.0005));
        animate(segment.end, to.end, { ...chartSpring(DONUT_CHART.motion.reveal, 0.0005), delay: DONUT_CHART.lead + index * DONUT_CHART.stagger });

        return;
      }

      animate(segment.start, to.start, chartSpring(DONUT_CHART.motion.settle, 0.0005));
      animate(segment.end, to.end, chartSpring(DONUT_CHART.motion.settle, 0.0005));
    });

    schedule();
  });

  useEffect(() => {
    if (isShown) {
      sync();
    }
  }, [isShown, isReduced, signature]);

  useEffect(() => {
    segments.current.forEach((segment, key) => {
      const to = key === current ? 1 : 0;

      if (isReduced) {
        segment.lift.jump(to);
      } else if (segment.lift.get() !== to || segment.lift.isAnimating()) {
        animate(segment.lift, to, chartSpring(DONUT_CHART.motion.pop, 0.002));
      }
    });
  }, [current, isReduced, isShown, signature]);

  const hit = (event: PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect();

    if (!box?.width) {
      return undefined;
    }

    const ratio = DONUT_CHART.size / box.width;
    const dx = (event.clientX - box.left) * ratio - center;
    const dy = (event.clientY - box.top) * ratio - center;
    const radius = Math.hypot(dx, dy);

    if (radius < inner - DONUT_CHART.reach || radius > center) {
      return null;
    }

    const turn = donutChartTurn(dx, dy);

    return [...targets.current].find(([, arc]) => arc.end > arc.start && turn >= arc.start && turn < arc.end)?.[0];
  };

  const onRingMove = (event: PointerEvent<SVGSVGElement>) => {
    if (event.pointerType !== 'mouse') {
      return;
    }

    const key = hit(event);

    if (key !== undefined && key !== preview) {
      setPreview(key);
    }
  };

  const onRingDown = (event: PointerEvent<SVGSVGElement>) => {
    const key = hit(event);

    if (key) {
      setSelected(selected === key ? null : key);
    }
  };

  const onRowKey = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (event.key === 'Escape' && selected !== null) {
      event.preventDefault();
      setSelected(null);

      return;
    }

    const next = match(event.key)
      .with('ArrowDown', 'ArrowRight', () => index + 1)
      .with('ArrowUp', 'ArrowLeft', () => index - 1)
      .with('Home', () => 0)
      .with('End', () => slices.length - 1)
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();
    rowsRef.current[(next + slices.length) % slices.length]?.focus();
  };

  const onRowBlur = (event: FocusEvent<HTMLButtonElement>) => {
    if (!(event.relatedTarget instanceof Node && event.currentTarget.closest('ul')?.contains(event.relatedTarget))) {
      setPreview(null);
    }
  };

  const readouts: DonutChartTypes.DonutChartReadout[] = [
    { key: DONUT_CHART.total, label: centerLabel ?? m.ui_donut_chart_total(), value: total, share: null },
    ...slices.map((item) => ({ key: item.key, label: item.label, value: item.value, share: total ? item.value / total : 0 })),
  ];

  const activeIndex = Math.max(0, readouts.findIndex((item) => item.key === (current ?? DONUT_CHART.total)));

  return (
    <figure
      aria-label={title ? undefined : name}
      aria-labelledby={title ? `${uid}-title` : undefined}
      className="m-0 grid min-w-0 gap-6 text-foreground"
      ref={figureRef}
    >
      {title || caption ? (
        <div className="grid min-w-0 gap-0.5">
          {title ? <span className="truncate text-sm font-medium" id={`${uid}-title`}>{title}</span> : null}
          {caption ? <span className="truncate text-sm text-muted-foreground/80">{caption}</span> : null}
        </div>
      ) : null}
      <div className="relative aspect-square max-w-full justify-self-center" style={{ width: DONUT_CHART.size }}>
        <svg
          aria-hidden
          className="block size-full overflow-visible data-hovering:cursor-pointer"
          data-hovering={current !== null || undefined}
          focusable="false"
          ref={svgRef}
          viewBox={`0 0 ${DONUT_CHART.size} ${DONUT_CHART.size}`}
          onPointerDown={onRingDown}
          onPointerLeave={() => setPreview(null)}
          onPointerMove={onRingMove}
        >
          <circle
            className="fill-none stroke-muted-foreground/10 opacity-0 transition-opacity duration-480 data-idle:opacity-100 motion-reduce:transition-none"
            cx={center}
            cy={center}
            data-idle={!isShown || !total || undefined}
            r={(outer + inner) / 2}
            strokeWidth={outer - inner}
          />
          {slices.map((item) => (
            <path
              className="transition-[fill,opacity] duration-240 [shape-rendering:geometricPrecision] data-dim:opacity-45 motion-reduce:transition-none"
              data-dim={(current !== null && item.key !== current) || undefined}
              data-key={item.key}
              key={item.key}
              ref={registerPath}
              style={{ fill: item.color }}
            />
          ))}
        </svg>
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-1/2 grid -translate-1/2"
          style={{ width: `calc(${((inner * 2) / DONUT_CHART.size) * 100}% - 16px)` }}
        >
          {readouts.map((item, index) => {
            const place = index - activeIndex;

            return (
              <motion.span
                animate={{ opacity: place === 0 ? 1 : 0, y: `${DONUT_CHART.drum * Math.sign(place)}em` }}
                className="grid min-w-0 justify-items-center gap-0.5 text-center [grid-area:1/1]"
                initial={false}
                key={item.key}
                transition={match({ isReduced, isActive: place === 0 })
                  .with({ isReduced: true }, () => ({ duration: 0 }))
                  .with({ isActive: true }, () => DONUT_CHART.motion.enter)
                  .otherwise(() => DONUT_CHART.motion.leave)}
              >
                <span className="block min-h-[1.4em] w-full truncate text-xs leading-[1.4] text-muted-foreground">{item.label}</span>
                <span className="block min-h-[1.1em] max-w-full truncate text-[1.75rem] leading-[1.1] font-medium tracking-[-0.03em] tabular-nums">
                  <DonutChartCount format={donutChartValue} isReduced={isReduced} value={item.value} />
                </span>
                <span className="block min-h-[1.4em] w-full truncate text-xs leading-[1.4] text-muted-foreground/80 tabular-nums">
                  {item.share === null ? null : m.ui_donut_chart_share({ share: donutChartShare(item.share) })}
                </span>
              </motion.span>
            );
          })}
        </div>
      </div>
      <ul aria-label={name} className="m-0 grid list-none gap-0.5 p-0" onPointerLeave={() => setPreview(null)}>
        {slices.map((item, index) => (
          <li key={item.key}>
            <button
              aria-pressed={selected === item.key}
              className={cn(
                'grid min-h-10 w-full grid-cols-[10px_minmax(0,1fr)_auto_3.25em] items-center gap-x-2.5 rounded-xl px-2.5 py-1.5 text-left text-sm outline-none',
                'transition-[background-color,scale] duration-160 hover:bg-foreground/5 focus-visible:ring-[3px] focus-visible:ring-ring/50 active:scale-[.985]',
                'aria-pressed:bg-foreground/5 motion-reduce:transition-none data-active:bg-foreground/5',
              )}
              data-active={item.key === current || undefined}
              ref={(node) => {
                rowsRef.current[index] = node;
              }}
              type="button"
              onBlur={onRowBlur}
              onClick={() => setSelected(selected === item.key ? null : item.key)}
              onFocus={(event) => {
                if (event.currentTarget.matches(':focus-visible')) {
                  setPreview(item.key);
                }
              }}
              onKeyDown={(event) => onRowKey(event, index)}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') {
                  setPreview(item.key);
                }
              }}
            >
              <span aria-hidden className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.label}</span>
              <span className="justify-self-end text-muted-foreground tabular-nums">
                <DonutChartCount format={donutChartValue} isReduced={isReduced} value={item.value} />
              </span>
              <span className="justify-self-end font-medium tabular-nums">
                <DonutChartCount format={donutChartShare} isReduced={isReduced} value={total ? item.value / total : 0} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </figure>
  );
}
