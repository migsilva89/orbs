import { animate, AnimatePresence, useMotionValue } from 'motion/react';
import * as motion from 'motion/react-m';
import { useLayoutEffect, useRef } from 'react';
import { match } from 'ts-pattern';
import { ACTIVITY_HEATMAP } from '../services/activity-heatmap/activity-heatmap.constants';
import { chartClamp } from '../services/chart/chart.utils';
import type { ActivityHeatmapChange, ActivityHeatmapTip as ActivityHeatmapTipContent } from '../types/activity-heatmap.types';
import type { RefObject } from 'react';

interface ActivityHeatmapTipProps {
  tip: ActivityHeatmapTipContent | null
  isOpen: boolean
  change: ActivityHeatmapChange
  isReduced: boolean
  rootRef: RefObject<HTMLDivElement | null>
  scrollerRef: RefObject<HTMLDivElement | null>
}

export function ActivityHeatmapTip({ tip, isOpen, change, isReduced, rootRef, scrollerRef }: ActivityHeatmapTipProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const width = useMotionValue<number | 'auto'>('auto');
  const measureRef = useRef<HTMLSpanElement>(null);
  const wasOpen = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const measure = measureRef.current;

    if (!tip || !root || !measure) {
      return;
    }

    const place = (isGliding: boolean) => {
      const box = root.getBoundingClientRect();
      const cell = tip.anchor.getBoundingClientRect();
      const next = Math.ceil(measure.getBoundingClientRect().width);
      const half = next / 2 + ACTIVITY_HEATMAP.tipInset;
      const nextX = chartClamp(cell.left - box.left + cell.width / 2, half + 2, box.width - half - 2);
      const nextY = cell.top - box.top;

      if (isGliding) {
        animate(x, nextX, ACTIVITY_HEATMAP.snappy);
        animate(y, nextY, ACTIVITY_HEATMAP.snappy);
        animate(width, next, ACTIVITY_HEATMAP.morph);
      } else {
        x.jump(nextX);
        y.jump(nextY);
        width.jump(next);
      }
    };

    place(isOpen && wasOpen.current && !isReduced);
    wasOpen.current = isOpen;

    if (!isOpen) {
      return;
    }

    const scroller = scrollerRef.current;
    const follow = () => place(false);
    scroller?.addEventListener('scroll', follow, { passive: true });

    return () => scroller?.removeEventListener('scroll', follow);
  }, [tip, isOpen, isReduced, rootRef, scrollerRef, x, y, width]);

  const isShown = isOpen && tip !== null;

  const transition = match({ isReduced, isOpen })
    .with({ isReduced: true, isOpen: true }, () => ACTIVITY_HEATMAP.reducedOpen)
    .with({ isOpen: true }, () => ACTIVITY_HEATMAP.open)
    .otherwise(() => ACTIVITY_HEATMAP.close);

  return (
    <motion.div aria-hidden className="pointer-events-none absolute top-0 left-0 z-5 size-0" style={{ x, y }}>
      <motion.div
        animate={isShown ? { opacity: 1, scale: 1 } : { opacity: 0, scale: isReduced ? 1 : 0.96 }}
        className="absolute bottom-2 left-0 block origin-bottom rounded-lg bg-foreground px-3 pt-[7px] pb-2 text-background shadow-md will-change-[transform,opacity]"
        initial={false}
        style={{ x: '-50%' }}
        transition={transition}
      >
        <motion.span className="relative block overflow-clip [overflow-clip-margin:8px]" style={{ width }}>
          <span className="invisible absolute top-0 left-0 grid w-max" ref={measureRef}>
            <span className="text-sm leading-[1.3] font-medium whitespace-nowrap tabular-nums">{tip?.primary}</span>
            <span className="text-xs leading-[1.35] whitespace-nowrap">{tip?.secondary}</span>
          </span>
          <AnimatePresence custom={change} initial={false} mode="popLayout">
            {tip ? (
              <motion.span
                animate="to"
                className="grid w-max"
                custom={change}
                exit="gone"
                initial="from"
                key={tip.key}
                transition={isReduced ? ACTIVITY_HEATMAP.reducedText : ACTIVITY_HEATMAP.text}
                variants={isReduced ? ACTIVITY_HEATMAP.reducedTipText : ACTIVITY_HEATMAP.tipText}
              >
                <span className="text-sm leading-[1.3] font-medium whitespace-nowrap tabular-nums">{tip.primary}</span>
                <span className="text-xs leading-[1.35] whitespace-nowrap text-background/70">{tip.secondary}</span>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </motion.span>
      </motion.div>
    </motion.div>
  );
}
