import * as motion from 'motion/react-m';
import { useLayoutEffect, useRef } from 'react';
import { BAR_CHART } from '@/services/bar-chart/bar-chart.constants';
import type { BarChartReading } from '@/types/bar-chart.types';
import type { MotionValue } from 'motion/react';

interface BarChartTipProps {
  label: string
  rows: BarChartReading[]
  x: MotionValue<number>
  width: MotionValue<number>
  isReduced: boolean
}

/** The hovered bar's values beside the cursor: to its right on the left half of the plot and to its left on the right half, gliding between bars. */
export function BarChartTip({ label, rows, x, width, isReduced }: BarChartTipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const scale = isReduced ? 1 : 0.96;

  useLayoutEffect(() => {
    const node = ref.current;

    if (!node) {
      return;
    }

    width.jump(node.offsetWidth);

    const observer = new ResizeObserver(() => width.jump(node.offsetWidth));
    observer.observe(node);

    return () => observer.disconnect();
  }, [width]);

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 z-1 grid min-w-32 origin-top gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-sm"
      exit={{ opacity: 0, scale, transition: BAR_CHART.motion.fade }}
      initial={{ opacity: 0, scale }}
      ref={ref}
      style={{ x }}
      transition={isReduced ? { duration: 0 } : BAR_CHART.motion.enter}
    >
      <div className="truncate font-medium">{label}</div>
      <div className="grid gap-1.5">
        {rows.map((row) => (
          <div className="flex w-full items-center gap-2" key={row.key}>
            {rows.length > 1 ? <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: row.color }} /> : null}
            <span className="flex-1 truncate text-muted-foreground">{row.label}</span>
            <span className="font-medium whitespace-nowrap text-foreground tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
