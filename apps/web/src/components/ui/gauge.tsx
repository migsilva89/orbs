import { useHydrated } from '@tanstack/react-router';
import { animate, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { TextSwap } from '@/components/ui/text-swap';
import { cn } from '@/lib/cn';
import { chartClamp, chartFixedFormatter } from '@/services/chart/chart.utils';
import { GAUGE } from '@/services/gauge/gauge.constants';
import { gaugeArc, gaugeDecimals } from '@/services/gauge/gauge.utils';
import type { GaugeTone } from '@/types/gauge.types';

interface GaugeProps {
  value: number
  max?: number
  unit?: string
  status?: string
  label: string
  description?: string
  tone?: GaugeTone
}

const gaugeTrack = gaugeArc(1);

/** A 270 degree ring open at the bottom. It fills once seen, springs to each new value, and names its state under the number. */
export function Gauge({ value, max, unit = max === undefined ? '%' : '', status, label, description, tone = 'default' }: GaugeProps) {
  const range = max ?? 100;
  const safeMax = range > 0 ? range : 1;
  const clamped = chartClamp(value, 0, safeMax);
  const percentage = clamped / safeMax;
  const formatter = chartFixedFormatter(gaugeDecimals(value));
  const shown = formatter.format(clamped);

  const rootRef = useRef<HTMLElement>(null);
  const sizerRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(rootRef, { once: true, amount: 0.5 });
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);

  const sweep = useMotionValue(0);
  const count = useMotionValue(0);
  const digitsWidth = useMotionValue<number | 'auto'>('auto');
  const path = useTransform(sweep, gaugeArc);
  const arcOpacity = useTransform(sweep, (current) => chartClamp(current / GAUGE.capFade, 0, 1));
  const digits = useTransform(count, (current) => formatter.format(chartClamp(current, 0, safeMax)));
  const [isFilled, setIsFilled] = useState(false);
  const [moved, setMoved] = useState({ value: clamped, direction: 1 });

  if (moved.value !== clamped) {
    setMoved({ value: clamped, direction: clamped < moved.value ? -1 : 1 });
  }

  useEffect(() => {
    if (isReduced) {
      sweep.jump(percentage);
      count.jump(clamped);
      const frame = requestAnimationFrame(() => setIsFilled(true));

      return () => cancelAnimationFrame(frame);
    }

    if (!isInView) {
      return;
    }

    const arc = animate(sweep, percentage, isFilled ? GAUGE.morph : GAUGE.reveal);
    const number = animate(count, clamped, { ...(isFilled ? GAUGE.smooth : GAUGE.reveal), onComplete: () => setIsFilled(true) });

    return () => {
      arc.stop();
      number.stop();
    };
  }, [clamped, count, isFilled, isInView, isReduced, percentage, sweep]);

  useEffect(() => {
    const node = sizerRef.current;

    if (!node) {
      return;
    }

    let measured: string | null = null;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.inlineSize ?? node.offsetWidth;

      if (measured !== null && measured !== node.textContent && !isReduced) {
        animate(digitsWidth, next, GAUGE.smooth);
      } else {
        digitsWidth.jump(next);
      }

      measured = node.textContent;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [digitsWidth, isReduced]);

  return (
    <figure className={cn('m-0 grid min-w-0 justify-items-center gap-2.5 text-center', GAUGE.tones[tone])} ref={rootRef}>
      <meter
        aria-label={label}
        aria-valuetext={status ? `${shown}${unit}, ${status}` : `${shown}${unit}`}
        className="sr-only"
        max={safeMax}
        min={0}
        value={clamped}
      />
      <div aria-hidden className="relative aspect-100/90 w-[min(100%,176px)]">
        <svg aria-hidden className="block size-full overflow-visible" focusable="false" viewBox="0 0 100 90">
          <path
            className="fill-none stroke-[color-mix(in_oklab,var(--gauge)_13%,transparent)] transition-[stroke] duration-240 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
            d={gaugeTrack}
            strokeLinecap="round"
            strokeWidth={GAUGE.stroke}
          />
          <motion.path
            className="fill-none stroke-(--gauge) transition-[stroke] duration-240 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none"
            d={path}
            strokeLinecap="round"
            strokeWidth={GAUGE.stroke}
            style={{ opacity: arcOpacity }}
          />
        </svg>
        <div className="pointer-events-none absolute top-0 left-0 grid aspect-square w-full place-content-center justify-items-center gap-1">
          <span className="relative inline-flex items-baseline text-[2.25rem] leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums">
            <motion.span className="inline-flex justify-end whitespace-nowrap" style={{ width: digitsWidth }}>{digits}</motion.span>
            <span className="ml-px text-[.5em] tracking-normal text-muted-foreground">{unit}</span>
            <span className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap" ref={sizerRef}>{shown}</span>
          </span>
          {status ? (
            <span className="min-h-[1.4em] min-w-[100px] text-xs leading-[1.4] font-medium text-(--gauge) transition-colors duration-240 motion-reduce:transition-none">
              <TextSwap direction={moved.direction} isReduced={isReduced} text={isFilled ? status : ''} />
            </span>
          ) : null}
        </div>
      </div>
      <figcaption className="grid min-w-0 gap-[3px]">
        <strong className="text-sm font-medium">
          <TextSwap isReduced={isReduced} text={label} />
        </strong>
        {description ? (
          <span className="text-xs text-muted-foreground/80 tabular-nums">
            <TextSwap direction={moved.direction} isReduced={isReduced} text={description} />
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
