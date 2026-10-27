import { m } from '@repo/i18n/client';
import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, motionValue, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import IconTriangleAlert from '~icons/lucide/triangle-alert';
import { cn } from '../lib/cn';
import { ARTIFACTS } from '../services/artifacts/artifacts.constants';
import { chartFixedFormatter, chartSoon, chartSpring } from '../services/chart/chart.utils';
import { USAGE_METER } from '../services/usage-meter/usage-meter.constants';
import { usageMeterDecimals, usageMeterStatus } from '../services/usage-meter/usage-meter.utils';
import { TextSwap } from './text-swap';
import { UsageMeterBadge } from './usage-meter-badge';
import { UsageMeterTicker } from './usage-meter-ticker';
import type * as UsageMeterTypes from '../types/usage-meter.types';
import type { AnimationPlaybackControls, MotionValue } from 'motion/react';
import type { KeyboardEvent, PointerEvent } from 'react';

interface UsageMeterProps {
  title: string
  used: number
  total: number
  unit?: string
  parts: UsageMeterTypes.UsageMeterPart[]
  caption?: string
}

interface UsageMeterSegmentProps {
  index: number
  amounts: MotionValue<number>[]
  span: MotionValue<number>
  width: MotionValue<number>
  highlight: 'on' | 'off' | undefined
}

const usageMeterSettle = chartSpring(USAGE_METER.springs.smooth);
const usageMeterReveal = chartSpring(USAGE_METER.springs.reveal);
const usageMeterColor = (index: number) => ARTIFACTS.chartColors[index % ARTIFACTS.chartColors.length];

function UsageMeterSegment({ index, amounts, span, width, highlight }: UsageMeterSegmentProps) {
  const x = useTransform(() => amounts.slice(0, index).reduce((sum, amount) => sum + amount.get(), 0) / span.get() * width.get());

  const scaleX = useTransform(() => {
    const full = width.get();
    const size = (amounts[index].get() / span.get()) * full;
    const rest = full - x.get() - size;

    return full > 0 ? Math.max(0, size - Math.min(USAGE_METER.gap, size, Math.max(0, rest))) / full : 0;
  });

  return (
    <motion.span
      className="absolute inset-0 transition-opacity duration-160 data-[highlight=off]:opacity-28 motion-reduce:transition-none"
      data-highlight={highlight}
      style={{ x, scaleX, originX: 0, background: usageMeterColor(index) }}
    />
  );
}

export function UsageMeter({ title, used, total, unit = '', parts, caption }: UsageMeterProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const legendRef = useRef<HTMLFieldSetElement>(null);
  const isInView = useInView(rootRef, { once: true, amount: 0.4 });
  const titleId = useId();
  const hatchId = `${titleId.replaceAll(/[^\w-]/g, '')}-hatch`;
  const isReady = isHydrated && (isInView || isReduced);

  const limit = total > 0 ? total : 1;
  const formatter = chartFixedFormatter(usageMeterDecimals([used, total, ...parts.map((part) => part.value)]));
  const format = (value: number) => (unit ? `${formatter.format(value)} ${unit}` : formatter.format(value));
  const filled = parts.reduce((sum, part) => sum + part.value, 0);
  const free = Math.max(0, limit - used);
  const over = Math.max(0, used - limit);
  const status = usageMeterStatus(used, limit);

  const [store] = useState(() => new Map<number, MotionValue<number>>());

  const amounts = parts.map((_, index) => {
    const amount = store.get(index) ?? motionValue(0);
    store.set(index, amount);

    return amount;
  });

  const shownLimit = useMotionValue(limit);
  const width = useMotionValue(0);
  const shownUsed = useTransform(() => amounts.reduce((sum, amount) => sum + amount.get(), 0));
  const span = useTransform(() => Math.max(shownLimit.get(), shownUsed.get(), 1e-6));
  const limitX = useTransform(() => Math.round((shownLimit.get() / span.get()) * width.get()));
  const overClip = useTransform(() => `inset(0 0 0 ${limitX.get() + USAGE_METER.gap}px)`);
  const markerOpacity = useMotionValue(0);

  useEffect(() => {
    let isOver = shownUsed.get() > shownLimit.get();
    let fading: AnimationPlaybackControls | undefined;
    markerOpacity.jump(isOver ? 1 : 0);

    const check = () => {
      const next = shownUsed.get() > shownLimit.get();

      if (next === isOver) {
        return;
      }

      isOver = next;
      fading?.stop();

      if (isReduced) {
        markerOpacity.jump(next ? 1 : 0);
      } else {
        fading = animate(markerOpacity, next ? 1 : 0, USAGE_METER.marker);
      }
    };

    const stops = [shownUsed.on('change', check), shownLimit.on('change', check)];

    return () => {
      stops.forEach((stop) => stop());
      fading?.stop();
    };
  }, [markerOpacity, isReduced, shownLimit, shownUsed]);

  useLayoutEffect(() => {
    const node = trackRef.current;

    if (!node) {
      return;
    }

    width.set(node.clientWidth);
    const observer = new ResizeObserver(() => width.set(node.clientWidth));
    observer.observe(node);

    return () => observer.disconnect();
  }, [width]);

  const values = parts.map((part) => part.value).join('|');
  const isRevealed = useRef(false);

  useEffect(() => {
    if (!isReady) {
      return;
    }

    const isFirst = !isRevealed.current;
    isRevealed.current = true;

    const stops = values.split('|').map((text, index) => {
      const amount = store.get(index);
      const target = Number(text);

      if (!amount || amount.get() === target) {
        return null;
      }

      if (isReduced) {
        amount.jump(target);
        return null;
      }

      return chartSoon(() => animate(amount, target, isFirst ? { ...usageMeterReveal, delay: index * USAGE_METER.stagger } : usageMeterSettle));
    });

    return () => stops.forEach((stop) => stop?.());
  }, [values, isReady, isReduced, store]);

  useEffect(() => {
    if (shownLimit.get() === limit) {
      return;
    }

    if (isReduced) {
      shownLimit.jump(limit);
      return;
    }

    return chartSoon(() => animate(shownLimit, limit, usageMeterSettle));
  }, [limit, isReduced, shownLimit]);

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [roving, setRoving] = useState(0);

  const items: UsageMeterTypes.UsageMeterItem[] = [
    ...parts.map((part, index) => ({ id: String(index), label: part.label, value: part.value, isFree: false })),
    {
      id: USAGE_METER.free,
      label: status === 'over' ? m.ui_usage_meter_over_label() : m.ui_usage_meter_free_label(),
      value: status === 'over' ? over : free,
      isFree: true,
    },
  ];

  const activeId = hoveredId ?? focusedId ?? pinnedId;
  const activeItem = items.find((item) => item.id === activeId);

  const highlightOf = (id: string) => match(activeId)
    .with(null, () => undefined)
    .with(id, () => 'on' as const)
    .otherwise(() => 'off' as const);

  const idAt = (clientX: number) => {
    const rect = trackRef.current?.getBoundingClientRect();

    if (!rect?.width) {
      return null;
    }

    const at = ((clientX - rect.left) / rect.width) * Math.max(limit, filled);
    let end = 0;

    const part = at > limit ? -1 : parts.findIndex((item) => {
      end += item.value;
      return at <= end;
    });

    return part < 0 ? USAGE_METER.free : String(part);
  };

  const onTrackMove = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      setHoveredId(idAt(event.clientX));
    }
  };

  const onTrackTap = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      return;
    }

    const id = idAt(event.clientX);
    setPinnedId((current) => (current === id ? null : id));
  };

  const onLegendKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (pinnedId || focusedId) {
        event.preventDefault();
        setPinnedId(null);
      }

      return;
    }

    const next = match(event.key)
      .with('ArrowRight', 'ArrowDown', () => roving + 1)
      .with('ArrowLeft', 'ArrowUp', () => roving - 1)
      .with('Home', () => 0)
      .with('End', () => items.length - 1)
      .otherwise(() => null);

    if (next === null) {
      return;
    }

    event.preventDefault();
    const index = (next + items.length) % items.length;
    setRoving(index);
    legendRef.current?.querySelectorAll<HTMLButtonElement>('button')[index]?.focus();
  };

  const headline = isReady ? activeItem?.value ?? used : 0;

  const captionText = match(activeItem)
    .with(undefined, () => m.ui_usage_meter_used({ total: format(total) }))
    .with({ isFree: true }, () => (status === 'over' ? m.ui_usage_meter_over_caption() : m.ui_usage_meter_free_caption()))
    .otherwise((item) => m.ui_usage_meter_in_part({ label: item.label, share: Math.round((item.value / limit) * 100) }));

  const badge = match(status)
    .with('over', () => m.ui_usage_meter_over({ value: format(over) }))
    .with('near', () => m.ui_usage_meter_near())
    .with('ok', () => m.ui_usage_meter_free({ value: format(free) }))
    .exhaustive();

  const summary = m.ui_usage_meter_summary({
    title,
    used: format(used),
    total: format(total),
    parts: parts.map((part) => m.ui_usage_meter_item({ label: part.label, value: format(part.value) })).join(', '),
  });

  const notice = status === 'over' ? `over:${over}` : status;
  const [announced, setAnnounced] = useState({ notice, message: '' });

  if (announced.notice !== notice) {
    setAnnounced({
      notice,
      message: match(status)
        .with('over', () => m.ui_usage_meter_announce_over({ value: format(over) }))
        .with('near', () => m.ui_usage_meter_announce_near({ value: format(free) }))
        .with('ok', () => m.ui_usage_meter_announce_ok({ value: format(free) }))
        .exhaustive(),
    });
  }

  return (
    <section aria-labelledby={titleId} className="grid min-w-0 gap-4 text-foreground" ref={rootRef}>
      <div className="flex min-h-7 min-w-0 items-center justify-between gap-3">
        <span className="min-w-0 text-base leading-[1.4] font-medium tracking-[-0.01em] text-balance" id={titleId}>{title}</span>
        <UsageMeterBadge isReduced={isReduced} status={status} text={badge} />
      </div>

      <p className="m-0 flex min-w-0 items-baseline gap-2">
        <span className="sr-only">{m.ui_usage_meter_used({ total: format(total) })}</span>
        <span aria-hidden className="flex-none text-[2.25rem] leading-[1.1] font-medium tracking-[-0.03em]">
          <UsageMeterTicker formatter={formatter} isReduced={isReduced} value={headline} />
        </span>
        <span aria-hidden className="min-w-0 flex-1 text-sm text-muted-foreground">
          <TextSwap className="block truncate" isReduced={isReduced} text={unit ? `${unit} ${captionText}` : captionText} />
        </span>
      </p>

      <div className="relative py-[5px]">
        <p className="sr-only">{summary}</p>
        <div
          aria-hidden
          className="relative isolate h-3.5 overflow-hidden rounded-full [-webkit-tap-highlight-color:transparent]"
          ref={trackRef}
          style={{ background: USAGE_METER.empty }}
          onPointerLeave={() => setHoveredId(null)}
          onPointerMove={onTrackMove}
          onPointerUp={onTrackTap}
        >
          {parts.map((part, index) => (
            <UsageMeterSegment amounts={amounts} highlight={highlightOf(String(index))} index={index} key={`${index}-${part.label}`} span={span} width={width} />
          ))}
          <motion.svg
            aria-hidden
            className="group/over pointer-events-none absolute inset-0 size-full"
            data-highlight={highlightOf(USAGE_METER.free)}
            focusable="false"
            style={{ clipPath: overClip, opacity: markerOpacity }}
          >
            <defs>
              <pattern height={6} id={hatchId} patternTransform="rotate(45)" patternUnits="userSpaceOnUse" width={6}>
                <rect className="fill-background" height={6} width={2.5} />
              </pattern>
            </defs>
            <rect className="fill-destructive opacity-0 transition-opacity duration-160 group-data-[highlight=on]/over:opacity-100 motion-reduce:transition-none" height="100%" width="100%" />
            <rect fill={`url(#${hatchId})`} height="100%" width="100%" />
          </motion.svg>
        </div>
        <motion.span aria-hidden className="pointer-events-none absolute inset-y-0 -left-px w-0.5 rounded-[1px] bg-foreground" style={{ x: limitX, opacity: markerOpacity }} />
      </div>

      <fieldset aria-label={m.ui_usage_meter_parts({ title })} className="m-0 -mx-2 grid min-w-0 grid-cols-[repeat(auto-fit,minmax(108px,1fr))] gap-0.5 border-0 p-0" ref={legendRef}>
        {items.map((item, index) => {
          const isWarning = item.isFree && status === 'over';

          return (
            <button
              aria-label={m.ui_usage_meter_item({ label: item.label, value: format(item.value) })}
              aria-pressed={pinnedId === item.id}
              className={cn(
                'grid min-w-0 cursor-pointer justify-items-start gap-0.5 rounded-lg p-2 text-left [-webkit-tap-highlight-color:transparent]',
                'transition-[background-color,opacity] duration-160 hover:bg-background aria-pressed:bg-background data-[highlight=off]:opacity-45 motion-reduce:transition-none',
              )}
              data-highlight={highlightOf(item.id)}
              key={item.id}
              tabIndex={index === roving ? 0 : -1}
              type="button"
              onBlur={() => setFocusedId(null)}
              onClick={() => {
                setRoving(index);
                setPinnedId((current) => (current === item.id ? null : item.id));
              }}
              onFocus={() => {
                setRoving(index);
                setFocusedId(item.id);
              }}
              onKeyDown={onLegendKey}
              onPointerEnter={(event) => event.pointerType === 'mouse' && setHoveredId(item.id)}
              onPointerLeave={(event) => event.pointerType === 'mouse' && setHoveredId(null)}
            >
              <span className="flex max-w-full min-w-0 items-center gap-2 text-sm leading-[1.4] text-muted-foreground">
                <span aria-hidden className="grid size-3 flex-none place-items-center">
                  <AnimatePresence initial={false} mode="popLayout">
                    {isWarning ? (
                      <motion.span animate="shown" className="grid place-items-center text-destructive [grid-area:1/1]" exit="gone" initial="hidden" key="alert" variants={isReduced ? USAGE_METER.fade : USAGE_METER.pop}>
                        <IconTriangleAlert className="size-3" />
                      </motion.span>
                    ) : (
                      <motion.span
                        animate="shown"
                        className={cn('size-2.5 rounded-[3px] [grid-area:1/1]', item.isFree && 'shadow-[inset_0_0_0_1px_var(--border)]')}
                        exit="gone"
                        initial="hidden"
                        key="swatch"
                        style={{ background: item.isFree ? USAGE_METER.empty : usageMeterColor(index) }}
                        variants={isReduced ? USAGE_METER.fade : USAGE_METER.pop}
                      />
                    )}
                  </AnimatePresence>
                </span>
                <span className="min-w-0 flex-1">
                  <TextSwap className="block truncate" isReduced={isReduced} text={item.label} />
                </span>
              </span>
              <span className="flex items-baseline gap-1 pl-5 text-base leading-[1.4] font-medium text-foreground">
                <UsageMeterTicker formatter={formatter} isReduced={isReduced} value={item.value} />
                {unit ? <span className="text-sm font-normal text-muted-foreground">{unit}</span> : null}
              </span>
            </button>
          );
        })}
      </fieldset>

      {caption ? <p className="m-0 text-xs text-muted-foreground">{caption}</p> : null}
      <p aria-atomic aria-live="polite" className="sr-only">{announced.message}</p>
    </section>
  );
}
