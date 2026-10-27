import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, useMotionValue, useReducedMotion } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { cn } from '../lib/cn';
import { chartAmount } from '../services/chart/chart.utils';
import { METRIC_CARD } from '../services/metric-card/metric-card.constants';
import { metricCardNumber, metricCardTrend } from '../services/metric-card/metric-card.utils';
import { TEXT_SWAP } from '../services/text-swap/text-swap.constants';
import { messageSurface } from './ai/message';
import { AnimatedCounter } from './animated-counter';
import type { MetricCardTrend } from '../types/metric-card.types';

interface MetricCardProps {
  label: string
  value: number | string
  prefix?: string
  suffix?: string
  change?: string
  trend?: MetricCardTrend
  context?: string
}

interface MetricCardSwapProps {
  text: string
  isReduced: boolean
  isMorph?: boolean
  isBlock?: boolean
}

function MetricCardSwap({ text, isReduced, isMorph = false, isBlock = false }: MetricCardSwapProps) {
  const sizerRef = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | 'auto'>('auto');
  const [shown, setShown] = useState({ text, direction: 1 });

  if (shown.text !== text) {
    setShown({ text, direction: chartAmount(text) < chartAmount(shown.text) ? -1 : 1 });
  }

  useEffect(() => {
    const node = sizerRef.current;

    if (!node) {
      return;
    }

    let measured: string | null = null;

    const observer = new ResizeObserver(([entry]) => {
      const next = entry.borderBoxSize[0]?.inlineSize ?? node.offsetWidth;

      if (next && measured !== null && measured !== node.textContent && !isReduced) {
        animate(width, next, METRIC_CARD.spring.morph);
      } else {
        width.jump(next || 'auto');
      }

      measured = next ? node.textContent : null;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [isMorph, isReduced, width]);

  return (
    <motion.span
      className={cn('relative max-w-full', isBlock ? 'block' : 'inline-flex overflow-x-clip align-top whitespace-nowrap')}
      style={isMorph ? { width } : undefined}
    >
      {isMorph ? (
        <span aria-hidden className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap" ref={sizerRef}>
          {text}
        </span>
      ) : null}
      <AnimatePresence custom={shown.direction} initial={false} mode="popLayout">
        <motion.span
          animate="shown"
          className={isBlock ? 'block' : 'inline-block'}
          custom={shown.direction}
          exit="gone"
          initial="hidden"
          key={text}
          variants={isReduced ? TEXT_SWAP.fade : TEXT_SWAP.rise}
        >
          {text}
        </motion.span>
      </AnimatePresence>
    </motion.span>
  );
}

export function MetricCard({ label, value, prefix, suffix, change, trend, context }: MetricCardProps) {
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);
  const number = metricCardNumber(value);

  const tone = match(trend ?? (change ? metricCardTrend(change) : undefined))
    .with('flat', () => undefined)
    .otherwise((direction) => direction);

  const scale = isReduced ? 1 : 0.96;

  return (
    <article className={cn('@container min-w-0', messageSurface)}>
      <div className="p-6 @max-[380px]:p-4">
        <div className="mb-8 flex items-center justify-between gap-3 @max-[380px]:mb-6 @max-[380px]:flex-wrap @max-[380px]:items-start">
          <span className="min-w-0 text-sm text-muted-foreground">
            <MetricCardSwap isBlock isReduced={isReduced} text={label} />
          </span>
          <AnimatePresence initial={false}>
            {change ? (
              <motion.small
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  'inline-flex flex-none rounded-full border px-2 py-[3px] text-sm text-muted-foreground tabular-nums',
                  'transition-colors duration-160 ease-[cubic-bezier(0.22,1,0.36,1)] data-trend:border-transparent',
                  'data-[trend=down]:bg-destructive/10 data-[trend=down]:text-destructive data-[trend=up]:bg-success/10 data-[trend=up]:text-success',
                )}
                data-trend={tone}
                exit={{ opacity: 0, scale, transition: METRIC_CARD.exit }}
                initial={{ opacity: 0, scale }}
                key="change"
                transition={isReduced ? { duration: 0 } : METRIC_CARD.spring.snappy}
              >
                <MetricCardSwap isMorph isReduced={isReduced} text={change} />
              </motion.small>
            ) : null}
          </AnimatePresence>
        </div>
        {number ? (
          <AnimatedCounter animateOnView decimals={number.decimals} prefix={prefix} suffix={suffix} value={number.amount} />
        ) : (
          <p className="text-4xl leading-none font-medium tracking-[-0.03em] wrap-break-word text-foreground">{`${prefix ?? ''}${value}${suffix ?? ''}`}</p>
        )}
        {context ? (
          <p className="mt-4 text-sm leading-[1.4] text-muted-foreground/80">
            <MetricCardSwap isBlock isReduced={isReduced} text={context} />
          </p>
        ) : null}
      </div>
    </article>
  );
}
