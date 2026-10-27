import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { cn } from '../lib/cn';
import { ARTIFACTS } from '../services/artifacts/artifacts.constants';
import { BAR_CHART } from '../services/bar-chart/bar-chart.constants';
import {
  barChartGroup,
  barChartLabels,
  barChartMean,
  barChartNumber,
  barChartPath,
  barChartRowY,
  barChartScale,
  barChartTick,
  barChartValue,
} from '../services/bar-chart/bar-chart.utils';
import { chartClamp, chartSoon, chartSpring, chartTone } from '../services/chart/chart.utils';
import { BarChartTip } from './bar-chart-tip';
import type { BarChartRow, BarChartSeries } from '../types/bar-chart.types';
import type { MotionValue } from 'motion/react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface ArcBarChartProps {
  data: BarChartRow[]
  x: string
  series: BarChartSeries[]
  average?: boolean
  title?: string
  value?: string
  change?: string
  unit?: string
  caption?: string
}

interface BarChartBarProps {
  x: number
  width: number
  value: number
  delay: number
  color: string
  isShown: boolean
  isReduced: boolean
  isDim: boolean
  scale: MotionValue<number>
}

const plotHeight = BAR_CHART.height - BAR_CHART.top;

function BarChartBar({ x, width, value, delay, color, isShown, isReduced, isDim, scale }: BarChartBarProps) {
  const amount = useMotionValue(0);
  const isGrown = useRef(false);
  const [firstDelay] = useState(delay);

  useEffect(() => {
    if (isReduced) {
      amount.jump(value);
      isGrown.current = true;

      return;
    }

    if (!isShown) {
      return;
    }

    const isFirst = !isGrown.current;
    isGrown.current = true;

    const transition = isFirst ? { ...chartSpring(BAR_CHART.motion.grow, 0.01), delay: firstDelay } : chartSpring(BAR_CHART.motion.settle, 0.01);

    return chartSoon(() => animate(amount, value, transition));
  }, [amount, firstDelay, isReduced, isShown, value]);

  const d = useTransform(() => barChartPath(x, width, (amount.get() / scale.get()) * plotHeight, BAR_CHART.height));

  return (
    <motion.path
      className="transition-opacity duration-160 ease-out data-dim:opacity-35 motion-reduce:transition-none"
      d={d}
      data-dim={isDim || undefined}
      style={{ fill: color }}
    />
  );
}

function BarChartGridline({ value, scale }: { value: number, scale: MotionValue<number> }) {
  const y = useTransform(() => barChartRowY(value, scale.get()));

  return (
    <motion.line
      animate={{ opacity: 1 }}
      className="stroke-border [shape-rendering:crispEdges]"
      exit={{ opacity: 0, transition: BAR_CHART.motion.fade }}
      initial={{ opacity: 0 }}
      transition={BAR_CHART.motion.standard}
      x1={0}
      x2="100%"
      y1={y}
      y2={y}
    />
  );
}

function BarChartTickLabel({ value, scale, avoid }: { value: number, scale: MotionValue<number>, avoid: MotionValue<number> | null }) {
  const y = useTransform(() => barChartRowY(value, scale.get()));
  const opacity = useTransform(() => (avoid ? chartClamp((Math.abs(y.get() - avoid.get()) - 10) / 6, 0, 1) : 1));

  return (
    <motion.span
      animate={{ opacity: 1 }}
      className="pointer-events-none absolute top-0 left-2.5 block h-0 whitespace-nowrap"
      exit={{ opacity: 0, transition: BAR_CHART.motion.fade }}
      initial={{ opacity: 0 }}
      style={{ y }}
      transition={BAR_CHART.motion.standard}
    >
      <motion.span className="block -translate-y-1/2 text-xs leading-none text-muted-foreground/80 tabular-nums" style={{ opacity }}>
        {barChartTick(value)}
      </motion.span>
    </motion.span>
  );
}

export function ArcBarChart({ data, x, series, average = false, title, value, change, unit, caption }: ArcBarChartProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);

  const uid = useId();
  const figureRef = useRef<HTMLElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(figureRef, { once: true, amount: 0.35 });
  const isShown = isInView || isReduced;

  const [active, setActive] = useState<number | null>(null);
  const [plotWidth, setPlotWidth] = useState(0);
  const [labelSizes, setLabelSizes] = useState<Record<string, number>>({});

  const count = Math.max(data.length, 1);
  const last = data.length - 1;
  const index = active === null || last < 0 ? null : Math.min(active, last);
  const cells = data.map((row) => series.map((item) => barChartNumber(row[item.key])));
  const numbers = cells.flat().filter((cell) => cell !== null);
  const mean = numbers.length > 0 ? numbers.reduce((sum, cell) => sum + cell, 0) / numbers.length : 0;
  const { top, ticks } = barChartScale(Math.max(0, ...numbers));
  const labels = data.map((row) => String(row[x] ?? ''));
  const suffix = unit ? ` ${unit}` : '';
  const name = title ?? m.ui_bar_chart_label();
  const tone = change ? chartTone(change) : 'flat';

  const scale = useMotionValue(top);
  const meanValue = useMotionValue(0);
  const cursor = useMotionValue(0);
  const side = useMotionValue(0);
  const tipWidth = useMotionValue(0);
  const slot = plotWidth / count;
  const group = barChartGroup(slot, series.length);
  const revealStep = Math.min(BAR_CHART.stagger, BAR_CHART.reveal / count);
  const rulerTexts = [...new Set(labels.filter(Boolean))];
  const rulerKey = rulerTexts.join('\n');

  useLayoutEffect(() => {
    const plot = plotRef.current;
    const ruler = rulerRef.current;

    if (!plot || !ruler) {
      return;
    }

    const read = () => {
      setPlotWidth(plot.clientWidth);

      const sizes = Object.fromEntries([...ruler.querySelectorAll<HTMLElement>('[data-text]')].map((node) => [node.dataset.text ?? '', node.offsetWidth]));

      setLabelSizes((current) => (Object.keys(sizes).every((text) => current[text] === sizes[text]) ? current : sizes));
    };

    read();

    const observer = new ResizeObserver(read);
    observer.observe(plot);
    observer.observe(ruler);

    return () => observer.disconnect();
  }, [rulerKey]);

  useEffect(() => {
    if (isReduced) {
      scale.jump(top);
      return;
    }

    return chartSoon(() => animate(scale, top, chartSpring(BAR_CHART.motion.settle, 0.01)));
  }, [isReduced, scale, top]);

  const isMeanStarted = useRef(false);

  useEffect(() => {
    if (isReduced) {
      meanValue.jump(mean);
      return;
    }

    if (!isInView) {
      return;
    }

    const isFirst = !isMeanStarted.current;
    isMeanStarted.current = true;

    const transition = { ...chartSpring(BAR_CHART.motion.settle, 0.01), delay: isFirst ? BAR_CHART.motion.mean.delay : 0 };

    return chartSoon(() => animate(meanValue, mean, transition));
  }, [isInView, isReduced, mean, meanValue]);

  const wasActive = useRef(false);

  useEffect(() => {
    if (index === null) {
      wasActive.current = false;
      return;
    }

    const toSide = index + 0.5 > count / 2 ? 1 : 0;

    if (isReduced || !wasActive.current) {
      cursor.jump(index);
      side.jump(toSide);
    }

    wasActive.current = true;

    if (isReduced) {
      return;
    }

    const controls = [animate(cursor, index, chartSpring(BAR_CHART.motion.glide, 0.01)), animate(side, toSide, chartSpring(BAR_CHART.motion.glide, 0.01))];

    return () => controls.forEach((control) => control.stop());
  }, [count, cursor, index, isReduced, side]);

  const cursorX = useTransform(() => Math.round((cursor.get() + 0.5) * slot) + 0.5);

  const tipX = useTransform(() => {
    const beside = Math.round((cursor.get() + 0.5) * slot) + BAR_CHART.tipGap - side.get() * (tipWidth.get() + BAR_CHART.tipGap * 2);

    return chartClamp(beside, 0, Math.max(0, plotWidth - tipWidth.get()));
  });

  const meanY = useTransform(() => barChartRowY(meanValue.get(), scale.get()));
  const meanText = useTransform(() => String(m.ui_bar_chart_average({ value: barChartMean(meanValue.get()) })));
  const shownLabels = barChartLabels(labels.map((text) => (text ? labelSizes[text] : undefined)), plotWidth);

  const pointAt = (clientX: number) => {
    const rect = plotRef.current?.getBoundingClientRect();

    return rect?.width ? chartClamp(Math.floor(((clientX - rect.left) / rect.width) * count), 0, last) : last;
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && index !== null) {
      event.preventDefault();
      setActive(null);

      return;
    }

    const from = index ?? last + 1;
    const page = Math.min(BAR_CHART.page, count);

    const next = match(event.key)
      .with('ArrowLeft', 'ArrowDown', () => from - 1)
      .with('ArrowRight', 'ArrowUp', () => (index === null ? last : from + 1))
      .with('PageDown', () => from - page)
      .with('PageUp', () => from + page)
      .with('Home', () => 0)
      .with('End', () => last)
      .otherwise(() => null);

    if (next === null || last < 0) {
      return;
    }

    event.preventDefault();
    setActive(chartClamp(next, 0, last));
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== 'mouse') {
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    if (last >= 0) {
      setActive(pointAt(event.clientX));
    }
  };

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (last >= 0 && (event.pointerType === 'mouse' || event.buttons)) {
      setActive(pointAt(event.clientX));
    }
  };

  const reading = (at: number) => series.flatMap((item, column) => {
    const cell = cells[at][column];

    return cell === null ? [] : [{ key: item.key, label: item.label, color: ARTIFACTS.chartColors[column], value: `${barChartValue(cell)}${suffix}` }];
  });

  const valueText = (at: number) => {
    const parts = reading(at).map((row) => (series.length > 1 ? `${row.label} ${row.value}` : row.value));

    return `${labels[at]}: ${parts.join(', ')}`;
  };

  const tipRows = index === null ? [] : reading(index);

  return (
    <figure
      aria-label={title ? undefined : name}
      aria-labelledby={title ? `${uid}-title` : undefined}
      className="m-0 grid min-w-0 gap-5 text-foreground"
      ref={figureRef}
    >
      {title || value || change || caption ? (
        <div className="grid min-w-0 gap-0.5">
          {title ? <span className="truncate text-sm font-medium" id={`${uid}-title`}>{title}</span> : null}
          {value ? (
            <span className="flex min-w-0 items-baseline gap-1.5 text-[2.25rem] leading-[1.1] font-medium tracking-[-0.03em] tabular-nums">
              <span className="truncate">{value}</span>
              {unit ? <span className="text-base font-normal tracking-normal text-muted-foreground">{unit}</span> : null}
            </span>
          ) : null}
          {change ? (
            <span className={cn('text-sm tabular-nums', tone === 'up' && 'text-success', tone === 'down' && 'text-destructive', tone === 'flat' && 'text-muted-foreground')}>
              {change}
            </span>
          ) : null}
          {caption ? <span className="truncate text-sm text-muted-foreground/80">{caption}</span> : null}
        </div>
      ) : null}
      <div className="relative grid min-w-0 grid-cols-[minmax(0,1fr)_52px] grid-rows-[auto_26px]">
        <div className="relative min-w-0 [grid-area:1/1]" ref={plotRef} style={{ height: BAR_CHART.height }}>
          <svg aria-hidden className="block overflow-hidden" height={BAR_CHART.height} width="100%">
            <AnimatePresence initial={false}>
              {ticks.filter((tick) => tick > 0).map((tick) => <BarChartGridline key={tick} scale={scale} value={tick} />)}
            </AnimatePresence>
            <motion.line
              animate={{ opacity: index === null ? 0 : 1 }}
              className="stroke-muted-foreground/50 [shape-rendering:crispEdges]"
              initial={false}
              transition={isReduced ? { duration: 0 } : BAR_CHART.motion.fade}
              x1={cursorX}
              x2={cursorX}
              y1={BAR_CHART.top}
              y2={BAR_CHART.height}
            />
            {cells.map((row, at) => row.map((cell, column) => (cell === null ? null : (
              <BarChartBar
                color={ARTIFACTS.chartColors[column]}
                delay={at * revealStep}
                isDim={index !== null && index !== at}
                isReduced={isReduced}
                isShown={isShown}
                key={`${at}:${series[column].key}`}
                scale={scale}
                value={Math.max(0, cell)}
                width={group.bar}
                x={(at + 0.5) * slot - group.group / 2 + column * (group.bar + group.gap)}
              />
            ))))}
            <line className="stroke-border [shape-rendering:crispEdges]" x1={0} x2="100%" y1={BAR_CHART.height - 0.5} y2={BAR_CHART.height - 0.5} />
            {average ? (
              <motion.line
                animate={{ opacity: isShown ? 1 : 0 }}
                className="stroke-muted-foreground [shape-rendering:crispEdges] [stroke-dasharray:3_3]"
                initial={false}
                transition={isReduced ? { duration: 0 } : BAR_CHART.motion.mean}
                x1={0}
                x2="100%"
                y1={meanY}
                y2={meanY}
              />
            ) : null}
          </svg>
        </div>
        <div aria-hidden className="relative min-w-0 [grid-area:1/2]">
          <AnimatePresence initial={false}>
            {ticks.map((tick) => <BarChartTickLabel avoid={average ? meanY : null} key={tick} scale={scale} value={tick} />)}
          </AnimatePresence>
          {average ? (
            <motion.span
              animate={{ opacity: isShown ? 1 : 0 }}
              className="pointer-events-none absolute top-0 left-2.5 block h-0 whitespace-nowrap"
              initial={false}
              style={{ y: meanY }}
              transition={isReduced ? { duration: 0 } : BAR_CHART.motion.mean}
            >
              <motion.span className="block -translate-y-1/2 text-xs leading-none font-medium text-foreground tabular-nums">{meanText}</motion.span>
            </motion.span>
          ) : null}
        </div>
        <div aria-hidden className="relative min-w-0 overflow-hidden [grid-area:2/1]">
          {labels.map((text, at) => (shownLabels.has(at) ? (
            <span
              className="absolute top-2 left-0 text-xs leading-none whitespace-nowrap text-muted-foreground/80 tabular-nums"
              key={`${at}:${text}`}
              style={{ transform: `translateX(${shownLabels.get(at)}px)` }}
            >
              {text}
            </span>
          ) : null))}
          <span className="pointer-events-none invisible absolute top-0 left-0 flex" ref={rulerRef}>
            {rulerTexts.map((text) => <span className="flex-none text-xs leading-none whitespace-nowrap tabular-nums" data-text={text} key={text}>{text}</span>)}
          </span>
        </div>
        <AnimatePresence>
          {index === null || tipRows.length === 0 ? null : (
            <BarChartTip
              isReduced={isReduced}
              key="tip"
              label={labels[index]}
              rows={tipRows}
              width={tipWidth}
              x={tipX}
            />
          )}
        </AnimatePresence>
        <input
          aria-label={name}
          aria-valuetext={last < 0 ? undefined : valueText(index ?? last)}
          className="peer sr-only"
          disabled={last < 0}
          max={Math.max(1, data.length)}
          min={1}
          step={1}
          type="range"
          value={(index ?? Math.max(last, 0)) + 1}
          onBlur={() => setActive(null)}
          onChange={(event) => setActive(Number(event.currentTarget.value) - 1)}
          onFocus={(event) => {
            if (event.currentTarget.matches(':focus-visible') && last >= 0) {
              setActive((current) => current ?? last);
            }
          }}
          onKeyDown={onKeyDown}
        />
        {/* Hover or drag across the plot to read a bar; vertical swipes still scroll the page. */}
        <div
          aria-hidden
          className="absolute inset-0 touch-pan-y rounded-lg select-none peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50"
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
        />
      </div>
      <table className="sr-only">
        <caption>{name}</caption>
        <thead>
          <tr>
            <th scope="col">{x}</th>
            {series.map((item) => <th key={item.key} scope="col">{item.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {cells.map((row, at) => (
            <tr key={`${at}:${labels[at]}`}>
              <th scope="row">{labels[at]}</th>
              {row.map((cell, column) => <td key={series[column].key}>{cell === null ? '' : `${barChartValue(cell)}${suffix}`}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
