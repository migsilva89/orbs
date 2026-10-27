import { getLocale } from '@repo/i18n/runtime';
import { cancelFrame, frame } from 'motion/react';
import type { ChartPoint, ChartSpringSpec, ChartTone } from '../../types/chart.types';

export const chartClamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export const chartAmount = (text: string) => Number((/-?\d+(?:\.\d+)?/.exec(text.replaceAll(',', '').replaceAll('−', '-')))?.[0] ?? Number.NaN);

export const chartFixedFormatter = (decimals: number) => new Intl.NumberFormat(getLocale(), {
  minimumFractionDigits: decimals,
  maximumFractionDigits: decimals,
});

export function chartSpring({ visualDuration, bounce }: ChartSpringSpec, restDelta = 0.001) {
  const root = (2 * Math.PI) / (visualDuration * 1.2);

  return {
    type: 'spring' as const,
    stiffness: root * root,
    damping: 2 * (1 - bounce) * root,
    restDelta,
    restSpeed: restDelta * 2,
  };
}

export function chartSoon(start: () => { stop: () => void }) {
  let controls: { stop: () => void } | null = null;

  const chartRun = () => {
    controls = start();
  };

  frame.update(chartRun);

  return () => {
    cancelFrame(chartRun);
    controls?.stop();
  };
}

export function chartValueAt(points: ChartPoint[], x: number) {
  if (points.length === 0) {
    return 0;
  }

  let low = 0;
  let high = points.length - 1;

  if (x <= points[low][0]) {
    return points[low][1];
  }

  if (x >= points[high][0]) {
    return points[high][1];
  }

  while (high - low > 1) {
    const middle = (low + high) >> 1;

    if (points[middle][0] < x) {
      low = middle;
    } else {
      high = middle;
    }
  }

  const [x0, y0] = points[low];
  const [x1, y1] = points[high];

  return x1 === x0 ? y1 : y0 + ((y1 - y0) * (x - x0)) / (x1 - x0);
}

export function chartTone(change: string): ChartTone {
  const sign = change.trim().charAt(0);

  if (sign === '+' || sign === '↑') {
    return 'up';
  }

  if (sign === '-' || sign === '−' || sign === '↓') {
    return 'down';
  }

  return 'flat';
}
