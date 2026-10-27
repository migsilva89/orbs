import { animate, AnimatePresence, useMotionValue } from 'motion/react';
import * as motion from 'motion/react-m';
import { useLayoutEffect, useRef } from 'react';
import IconCircleAlert from '~icons/lucide/circle-alert';
import IconTriangleAlert from '~icons/lucide/triangle-alert';
import { chartSpring } from '../services/chart/chart.utils';
import { USAGE_METER } from '../services/usage-meter/usage-meter.constants';
import { TextSwap } from './text-swap';
import type { UsageMeterStatus } from '../types/usage-meter.types';

interface UsageMeterBadgeProps {
  status: UsageMeterStatus
  text: string
  isReduced: boolean
}

const usageMeterFit = chartSpring(USAGE_METER.springs.morph, 0.01);

export function UsageMeterBadge({ status, text, isReduced }: UsageMeterBadgeProps) {
  const inner = useRef<HTMLSpanElement>(null);
  const width = useMotionValue<number | 'auto'>('auto');

  useLayoutEffect(() => {
    const node = inner.current;

    if (!node) {
      return;
    }

    let isMeasured = false;

    const observer = new ResizeObserver(() => {
      const next = node.offsetWidth;

      if (isMeasured && !isReduced) {
        animate(width, next, usageMeterFit);
      } else {
        width.jump(next);
      }

      isMeasured = next > 0;
    });

    observer.observe(node);

    return () => observer.disconnect();
  }, [isReduced, width]);

  return (
    <motion.span
      className="group/badge inline-flex h-7 flex-none justify-end overflow-hidden rounded-full bg-background text-xs leading-none font-medium text-muted-foreground transition-colors duration-240 data-[status=near]:bg-warning/15 data-[status=near]:text-foreground data-[status=over]:bg-destructive/10 data-[status=over]:text-foreground motion-reduce:transition-none"
      data-status={status}
      style={{ width }}
    >
      <span className="inline-flex flex-none items-center gap-1.5 px-3 whitespace-nowrap" ref={inner}>
        <AnimatePresence initial={false} mode="popLayout">
          {status === 'ok' ? null : (
            <motion.span
              animate="shown"
              className="grid place-items-center group-data-[status=near]/badge:text-warning group-data-[status=over]/badge:text-destructive"
              exit="gone"
              initial="hidden"
              key={status}
              variants={isReduced ? USAGE_METER.fade : USAGE_METER.pop}
            >
              {status === 'over' ? <IconTriangleAlert aria-hidden className="size-3.5" /> : <IconCircleAlert aria-hidden className="size-3.5" />}
            </motion.span>
          )}
        </AnimatePresence>
        <TextSwap isReduced={isReduced} text={text} />
      </span>
    </motion.span>
  );
}
