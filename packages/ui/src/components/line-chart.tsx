import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, useInView, useMotionValue, useMotionValueEvent, useReducedMotion, useSpring, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';
import { ARTIFACTS } from '../services/artifacts/artifacts.constants';
import { chartClamp, chartSpring, chartTone, chartValueAt } from '../services/chart/chart.utils';
import { LINE_CHART } from '../services/line-chart/line-chart.constants';
import {
  lineChartAxisPicks,
  lineChartCurves,
  lineChartFormatters,
  lineChartModel,
  lineChartMorphPoints,
  lineChartNiceScale,
  lineChartRange,
  lineChartTrackPatch,
} from '../services/line-chart/line-chart.utils';
import type * as LineChartTypes from '../types/line-chart.types';
import type { PointerEvent } from 'react';

interface ArcLineChartProps {
  data: LineChartTypes.LineChartRow[]
  x: string
  series: LineChartTypes.LineChartSeries[]
  area?: boolean
  title?: string
  value?: string
  change?: string
  caption?: string
}

const { height: HEIGHT, top: TOP, gap: GAP } = LINE_CHART;

const settle = chartSpring(LINE_CHART.spring.smooth);
const glide = chartSpring(LINE_CHART.spring.snappy, 0.0001);
const follow = { stiffness: glide.stiffness, damping: glide.damping, restDelta: 0.01 };
const draw = { duration: LINE_CHART.duration.considered * 1.75, ease: LINE_CHART.ease.inOut };
const fade = { duration: LINE_CHART.duration.standard, ease: LINE_CHART.ease.standard };
const fadeFast = { duration: LINE_CHART.duration.instant, ease: LINE_CHART.ease.standard };

const lineChartColor = (index: number) => ARTIFACTS.chartColors[index % ARTIFACTS.chartColors.length];
const lineChartSeriesStyle = (index: number): LineChartTypes.LineChartStyle => ({ '--series': lineChartColor(index) });

function useLineChartRowY(value: number, scale: LineChartTypes.LineChartMotionScale) {
  return useTransform(() => {
    const span = scale.max.get() - scale.min.get() || 1;

    return Math.round(TOP + (1 - (value - scale.min.get()) / span) * (HEIGHT - TOP)) + 0.5;
  });
}

function LineChartGridline({ value, scale }: { value: number, scale: LineChartTypes.LineChartMotionScale }) {
  const y = useLineChartRowY(value, scale);

  return (
    <motion.line
      animate={{ opacity: 1 }}
      className="stroke-border [shape-rendering:crispEdges]"
      exit={{ opacity: 0, transition: fadeFast }}
      initial={{ opacity: 0 }}
      transition={fade}
      x1={0}
      x2="100%"
      y1={y}
      y2={y}
    />
  );
}

function LineChartTick({ value, label, scale }: { value: number, label: string, scale: LineChartTypes.LineChartMotionScale }) {
  const y = useLineChartRowY(value, scale);

  return (
    <motion.span
      animate={{ opacity: 1 }}
      className="pointer-events-none absolute top-0 left-2.5 block h-0 whitespace-nowrap"
      exit={{ opacity: 0, transition: fadeFast }}
      initial={{ opacity: 0 }}
      style={{ y }}
      transition={fade}
    >
      <span className="block -translate-y-1/2 text-xs leading-none text-muted-foreground tabular-nums">{label}</span>
    </motion.span>
  );
}

export function ArcLineChart({ data, x, series, area = false, title, value, change, caption }: ArcLineChartProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);

  const figureRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const clipRef = useRef<SVGRectElement>(null);
  const crosshairRef = useRef<SVGLineElement>(null);
  const linesRef = useRef(new Map<string, SVGPathElement>());
  const areasRef = useRef(new Map<string, SVGPathElement>());
  const dotsRef = useRef(new Map<string, SVGCircleElement>());
  const groupsRef = useRef(new Map<string, SVGGElement>());
  const isInView = useInView(figureRef, { once: true, amount: 0.3 });
  const uid = `line${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  const model = lineChartModel(data, x, series);
  const formats = lineChartFormatters();
  const last = data.length - 1;
  const isEmpty = data.length === 0;
  const name = title ?? series.map((line) => line.label).join(', ');

  const [hidden, setHidden] = useState<string[]>([]);
  const visible = series.filter((line) => !hidden.includes(line.key));
  const isAllHidden = !isEmpty && visible.length === 0;

  const toggle = (key: string) => {
    setHidden((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  const [targets, setTargets] = useState(() => ({ signature: model.signature, curves: lineChartCurves(model) }));
  const [active, setActive] = useState<number | null>(null);

  if (targets.signature !== model.signature) {
    setTargets({ signature: model.signature, curves: lineChartCurves(model) });
    setActive(null);
  }

  const range = lineChartRange(model, visible.map((line) => line.key));
  const [steady, setSteady] = useState(() => range ?? lineChartNiceScale(0, 100));

  if (range && range.ticks.join() !== steady.ticks.join()) {
    setSteady(range);
  }

  const scaleMin = useMotionValue(steady.min);
  const scaleMax = useMotionValue(steady.max);
  const scale = { min: scaleMin, max: scaleMax };

  const index = active === null || isEmpty ? null : Math.min(active, last);
  const isScrubbing = index !== null;

  const widthRef = useRef(0);
  const [plotWidth, setPlotWidth] = useState(0);
  const tipSizeRef = useRef({ w: 0, h: 0 });
  const tracksRef = useRef(new Map<string, LineChartTypes.LineChartTrack>());
  const drawn = useMotionValue(0);
  const cursor = useMotionValue(1);
  const tipTargetX = useMotionValue(0);
  const tipTargetY = useMotionValue(0);
  const tipSpringX = useSpring(tipTargetX, follow);
  const tipSpringY = useSpring(tipTargetY, follow);
  const liveRef = useRef({ series, hidden });

  useLayoutEffect(() => {
    liveRef.current = { series, hidden };
  });

  const paint = useCallback(() => {
    const width = widthRef.current;

    if (!width) {
      return;
    }

    const low = scaleMin.get();
    const span = scaleMax.get() - low || 1;
    const toY = (point: number) => TOP + (1 - (point - low) / span) * (HEIGHT - TOP);
    const at = cursor.get();
    const dotYs: number[] = [];

    for (const line of liveRef.current.series) {
      const track = tracksRef.current.get(line.key);

      if (!track) {
        continue;
      }

      const presence = track.presence;
      const y = (point: number) => toY(low + (point - low) * presence);
      const path = track.points.length > 0 ? `M${track.points.map(([px, point]) => `${(px * width).toFixed(1)},${y(point).toFixed(1)}`).join('L')}` : '';

      linesRef.current.get(line.key)?.setAttribute('d', path);
      areasRef.current.get(line.key)?.setAttribute('d', path ? `${path}L${width},${HEIGHT}L0,${HEIGHT}Z` : '');

      const group = groupsRef.current.get(line.key);

      if (group) {
        group.style.opacity = String(presence);
      }

      const dot = dotsRef.current.get(line.key);

      if (dot && track.points.length > 0) {
        const cy = y(chartValueAt(track.points, at));

        dot.setAttribute('cx', (at * width).toFixed(1));
        dot.setAttribute('cy', cy.toFixed(1));

        if (presence > 0.5) {
          dotYs.push(cy);
        }
      }
    }

    clipRef.current?.setAttribute('width', String(drawn.get() * (width + 16)));

    const cx = Math.round(at * width) + 0.5;

    crosshairRef.current?.setAttribute('x1', String(cx));
    crosshairRef.current?.setAttribute('x2', String(cx));

    const { w: tipWidth, h: tipHeight } = tipSizeRef.current;
    const right = cx + GAP;
    const left = right + tipWidth > width ? cx - GAP - tipWidth : right;
    const middle = dotYs.length > 0 ? dotYs.reduce((sum, point) => sum + point, 0) / dotYs.length : HEIGHT / 2;

    tipTargetX.set(chartClamp(left, 0, Math.max(0, width - tipWidth)));
    tipTargetY.set(chartClamp(middle - tipHeight / 2, 0, Math.max(0, HEIGHT - tipHeight)));
  }, [cursor, drawn, scaleMax, scaleMin, tipTargetX, tipTargetY]);

  useMotionValueEvent(cursor, 'change', paint);
  useMotionValueEvent(drawn, 'change', paint);
  useMotionValueEvent(scaleMin, 'change', paint);
  useMotionValueEvent(scaleMax, 'change', paint);
  useLayoutEffect(paint);

  useLayoutEffect(() => {
    const node = plotRef.current;
    const bubble = tipRef.current;

    if (!node) {
      return;
    }

    const read = () => {
      widthRef.current = node.clientWidth;
      setPlotWidth(node.clientWidth);

      if (bubble) {
        tipSizeRef.current = { w: bubble.offsetWidth, h: bubble.offsetHeight };
      }

      paint();
    };

    read();

    const observer = new ResizeObserver(read);

    observer.observe(node);

    if (bubble) {
      observer.observe(bubble);
    }

    return () => observer.disconnect();
  }, [paint]);

  useEffect(() => {
    const moves: LineChartTypes.LineChartMove[] = [];

    for (const [key, target] of targets.curves) {
      const track = tracksRef.current.get(key);

      if (!track) {
        tracksRef.current.set(key, {
          points: target,
          presence: liveRef.current.hidden.includes(key) ? 0 : 1,
          fade: null,
        });
        continue;
      }

      if (track.points.length === 0 || target.length === 0 || isReduced) {
        lineChartTrackPatch(tracksRef.current, key, { points: target });
        continue;
      }

      moves.push({
        key,
        target,
        ...lineChartMorphPoints(track.points, target),
      });
    }

    if (moves.length === 0) {
      paint();

      return;
    }

    const controls = animate(0, 1, {
      ...settle,
      restDelta: 0.0005,
      onUpdate: (progress) => {
        for (const move of moves) {
          const points = move.xs.map((px, at): LineChartTypes.LineChartPoint => [px, move.from[at] + (move.to[at] - move.from[at]) * progress]);

          lineChartTrackPatch(tracksRef.current, move.key, { points });
        }

        paint();
      },
      onComplete: () => {
        for (const move of moves) {
          lineChartTrackPatch(tracksRef.current, move.key, { points: move.target });
        }

        paint();
      },
    });

    return () => controls.stop();
  }, [isReduced, paint, targets]);

  useEffect(() => {
    for (const [key, track] of tracksRef.current) {
      const to = hidden.includes(key) ? 0 : 1;

      if (track.presence === to) {
        continue;
      }

      track.fade?.stop();

      if (isReduced) {
        lineChartTrackPatch(tracksRef.current, key, { presence: to });
        continue;
      }

      lineChartTrackPatch(tracksRef.current, key, {
        fade: animate(track.presence, to, {
          ...settle,
          onUpdate: (presence) => {
            lineChartTrackPatch(tracksRef.current, key, { presence });
            paint();
          },
        }),
      });
    }

    paint();
  }, [hidden, isReduced, paint]);

  useEffect(() => {
    if (isReduced) {
      scaleMin.jump(steady.min);
      scaleMax.jump(steady.max);

      return;
    }

    const controls = [animate(scaleMin, steady.min, settle), animate(scaleMax, steady.max, settle)];

    return () => {
      for (const control of controls) {
        control.stop();
      }
    };
  }, [isReduced, scaleMax, scaleMin, steady]);

  useEffect(() => {
    if (isEmpty) {
      return;
    }

    if (isReduced) {
      drawn.jump(1);

      return;
    }

    if (!isInView || drawn.get() >= 1) {
      return;
    }

    const controls = animate(drawn, 1, draw);

    return () => controls.stop();
  }, [drawn, isEmpty, isInView, isReduced]);

  const wasScrubbingRef = useRef(false);

  useEffect(() => {
    if (index === null) {
      wasScrubbingRef.current = false;

      return;
    }

    const to = last > 0 ? index / last : 0.5;

    if (isReduced || !wasScrubbingRef.current) {
      cursor.jump(to);
      tipSpringX.jump(tipTargetX.get());
      tipSpringY.jump(tipTargetY.get());
    }

    wasScrubbingRef.current = true;

    if (isReduced) {
      return;
    }

    const controls = animate(cursor, to, glide);

    return () => controls.stop();
  }, [cursor, index, isReduced, last, tipSpringX, tipSpringY, tipTargetX, tipTargetY]);

  const pointAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();

    if (!rect?.width || last < 1) {
      return Math.max(0, last);
    }

    return chartClamp(Math.round(((clientX - rect.left) / rect.width) * last), 0, last);
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (isEmpty) {
      return;
    }

    if (event.pointerType !== 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setActive(pointAt(event.clientX));
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isEmpty && (event.pointerType === 'mouse' || event.buttons)) {
      setActive(pointAt(event.clientX));
    }
  };

  const reading = index ?? last;

  const valueOf = (key: string, row: number) => {
    const cell = model.cells[key][row];

    return cell === null ? '' : formats.value.format(cell);
  };

  const valueText = isEmpty ? m.ui_line_chart_empty() : `${model.labels[reading]}: ${visible.map((line) => `${line.label} ${valueOf(line.key, reading)}`).join(', ')}`;
  const picks = lineChartAxisPicks(data.length, plotWidth);
  const tipX = isReduced ? tipTargetX : tipSpringX;
  const tipY = isReduced ? tipTargetY : tipSpringY;
  const tone = change ? chartTone(change) : 'flat';
  const hasReadout = [caption, value, change].some(Boolean);

  return (
    <figure aria-label={name} className="m-0 grid min-w-0 gap-4 text-foreground" ref={figureRef}>
      {title || hasReadout ? (
        <figcaption className="grid min-w-0 gap-4">
          {title ? <p className="m-0 text-base leading-tight font-medium tracking-tight">{title}</p> : null}
          {hasReadout ? (
            <div className="grid min-w-0 gap-1.5">
              {caption ? <span className="mb-0.5 text-xs text-muted-foreground">{caption}</span> : null}
              {value ? <span className="text-[36px] leading-none font-medium tracking-[-0.03em] tabular-nums">{value}</span> : null}
              {change ? (
                <span className={cn('text-sm tabular-nums', tone === 'up' && 'text-success', tone === 'down' && 'text-destructive', tone === 'flat' && 'text-muted-foreground')}>
                  {change}
                </span>
              ) : null}
            </div>
          ) : null}
        </figcaption>
      ) : null}
      {series.length > 1 ? (
        <fieldset aria-label={m.ui_line_chart_series()} className="-mx-2 flex min-w-0 flex-wrap gap-x-1 gap-y-0.5">
          {series.map((line, at) => (
            <button
              aria-pressed={!hidden.includes(line.key)}
              className="group/toggle inline-flex min-h-8 items-center gap-2 rounded-full pr-2.5 pl-2 text-sm text-muted-foreground transition-[color,background-color,scale] duration-160 ease-[cubic-bezier(0.22,1,0.36,1)] select-none [-webkit-tap-highlight-color:transparent] hover:bg-foreground/5 hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none active:scale-97 aria-[pressed=false]:text-muted-foreground/80 motion-reduce:transition-none"
              key={line.key}
              onClick={() => toggle(line.key)}
              style={lineChartSeriesStyle(at)}
              type="button"
            >
              <span aria-hidden="true" className="flex h-2.5 w-3.5 flex-none items-center">
                <span className="h-[2.5px] w-full origin-left rounded-xs bg-(--series) transition-[scale,opacity] duration-240 ease-out-quint group-aria-[pressed=false]/toggle:scale-x-35 group-aria-[pressed=false]/toggle:opacity-45 motion-reduce:transition-none" />
              </span>
              <span className="whitespace-nowrap transition-opacity duration-160 group-aria-[pressed=false]/toggle:line-through group-aria-[pressed=false]/toggle:decoration-current/55 group-aria-[pressed=false]/toggle:opacity-72 motion-reduce:transition-none">
                {line.label}
              </span>
            </button>
          ))}
        </fieldset>
      ) : null}
      <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_48px] grid-rows-[auto_26px]">
        <div
          className="relative col-start-1 row-start-1 min-w-0 touch-pan-y select-none [-webkit-tap-highlight-color:transparent]"
          onPointerCancel={() => setActive(null)}
          onPointerDown={onPointerDown}
          onPointerLeave={(event) => {
            if (event.pointerType === 'mouse') {
              setActive(null);
            }
          }}
          onPointerMove={onPointerMove}
          onPointerUp={(event) => {
            if (event.pointerType !== 'mouse') {
              setActive(null);
            }
          }}
          ref={plotRef}
          style={{ height: HEIGHT }}
        >
          <input
            aria-label={name}
            aria-valuetext={valueText}
            className="sr-only"
            disabled={isEmpty}
            max={Math.max(0, last)}
            min={0}
            onBlur={() => setActive(null)}
            onChange={(event) => setActive(Number(event.currentTarget.value))}
            onFocus={(event) => {
              if (!event.currentTarget.matches(':focus-visible')) {
                return;
              }

              setActive((current) => current ?? last);
            }}
            onKeyDown={(event) => {
              if (event.key !== 'Escape' || !isScrubbing) {
                return;
              }

              event.preventDefault();
              setActive(null);
            }}
            step={1}
            type="range"
            value={Math.max(0, reading)}
          />
          <svg aria-hidden="true" className="block overflow-visible" focusable="false" height={HEIGHT} width="100%">
            <defs>
              <clipPath clipPathUnits="userSpaceOnUse" id={`${uid}-draw`}>
                <rect height={HEIGHT + 32} ref={clipRef} width={0} x={-8} y={-16} />
              </clipPath>
            </defs>
            <AnimatePresence initial={false}>
              {steady.ticks.slice(1).map((tick) => <LineChartGridline key={tick} scale={scale} value={tick} />)}
            </AnimatePresence>
            <line className="stroke-input [shape-rendering:crispEdges]" x1={0} x2="100%" y1={HEIGHT - 0.5} y2={HEIGHT - 0.5} />
            <line
              className={cn('stroke-input opacity-0 transition-opacity duration-120 [shape-rendering:crispEdges] motion-reduce:transition-none', isScrubbing && 'opacity-100')}
              ref={crosshairRef}
              y1={TOP - 4}
              y2={HEIGHT}
            />
            <g clipPath={`url(#${uid}-draw)`}>
              {series.map((line, at) => (
                <g
                  key={line.key}
                  ref={(node) => {
                    if (node) {
                      groupsRef.current.set(line.key, node);
                    } else {
                      groupsRef.current.delete(line.key);
                    }
                  }}
                  style={lineChartSeriesStyle(at)}
                >
                  {area || at === 0 ? (
                    <path
                      className="fill-[color-mix(in_oklab,var(--series)_9%,transparent)] stroke-none"
                      ref={(node) => {
                        if (node) {
                          areasRef.current.set(line.key, node);
                        } else {
                          areasRef.current.delete(line.key);
                        }
                      }}
                    />
                  ) : null}
                  <path
                    className="fill-none stroke-(--series) [stroke-linecap:round] [stroke-linejoin:round]"
                    ref={(node) => {
                      if (node) {
                        linesRef.current.set(line.key, node);
                      } else {
                        linesRef.current.delete(line.key);
                      }
                    }}
                    strokeWidth={2}
                  />
                </g>
              ))}
            </g>
            {series.map((line, at) => (
              <circle
                className={cn(
                  'fill-(--series) stroke-background opacity-0 transition-opacity duration-120 motion-reduce:transition-none',
                  isScrubbing && !hidden.includes(line.key) && 'opacity-100',
                )}
                key={line.key}
                r={LINE_CHART.dotRadius}
                ref={(node) => {
                  if (node) {
                    dotsRef.current.set(line.key, node);
                  } else {
                    dotsRef.current.delete(line.key);
                  }
                }}
                strokeWidth={2}
                style={lineChartSeriesStyle(at)}
              />
            ))}
          </svg>
          <motion.div
            aria-hidden="true"
            className={cn(
              'pointer-events-none absolute top-0 left-0 z-10 grid max-w-[min(220px,100%)] min-w-35 scale-96 gap-1 rounded-xl border bg-popover px-3 py-2.5 text-popover-foreground opacity-0 shadow-floating transition-[opacity,scale] duration-160 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none',
              isScrubbing && 'scale-100 opacity-100',
            )}
            ref={tipRef}
            style={{ x: tipX, y: tipY }}
          >
            <p className="m-0 mb-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums">{model.labels[reading] ?? ''}</p>
            {visible.map((line) => (
              <p className="m-0 flex min-w-0 items-center gap-2 text-sm" key={line.key} style={lineChartSeriesStyle(series.indexOf(line))}>
                <span className="h-[2.5px] w-2.5 flex-none rounded-xs bg-(--series)" />
                <span className="min-w-0 flex-1 truncate text-muted-foreground">{line.label}</span>
                <span className="ml-2 flex-none font-medium whitespace-nowrap tabular-nums">{isEmpty ? '' : valueOf(line.key, reading)}</span>
              </p>
            ))}
          </motion.div>
          <AnimatePresence initial={false}>
            {isEmpty || isAllHidden ? (
              <motion.p
                animate={{ opacity: 1 }}
                className="pointer-events-none absolute inset-0 m-0 grid place-items-center text-sm text-muted-foreground"
                exit={{ opacity: 0, transition: fadeFast }}
                initial={{ opacity: 0 }}
                key={isEmpty ? 'empty' : 'hidden'}
              >
                {isEmpty ? m.ui_line_chart_empty() : m.ui_line_chart_hidden()}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>
        <div aria-hidden="true" className="relative col-start-2 row-start-1 min-w-0">
          <AnimatePresence initial={false}>
            {steady.ticks.map((tick) => <LineChartTick key={tick} label={formats.tick.format(tick)} scale={scale} value={tick} />)}
          </AnimatePresence>
        </div>
        <div aria-hidden="true" className="relative col-start-1 row-start-2 min-w-0">
          <AnimatePresence initial={false}>
            {picks.map((at) => {
              const share = last > 0 ? at / last : 0.5;

              return (
                <motion.span
                  animate={{ opacity: 1 }}
                  className="absolute top-2 text-xs leading-none whitespace-nowrap text-muted-foreground tabular-nums"
                  exit={{ opacity: 0, transition: fadeFast }}
                  initial={{ opacity: 0 }}
                  key={`${at}:${model.labels[at]}`}
                  style={{ left: `${share * 100}%`, translateX: `${-share * 100}%` }}
                  transition={fade}
                >
                  {model.labels[at]}
                </motion.span>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
      {isEmpty ? null : (
        <div className="sr-only">
          <table>
            <caption>{name}</caption>
            <thead>
              <tr>
                <th scope="col">{x}</th>
                {series.map((line) => <th key={line.key} scope="col">{line.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {model.labels.map((label, row) => (
                <tr key={`${row}:${label}`}>
                  <th scope="row">{label}</th>
                  {series.map((line) => <td key={line.key}>{valueOf(line.key, row)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </figure>
  );
}
