import { getLocale } from '@repo/i18n/runtime';
import { chartValueAt } from '../chart/chart.utils';
import { SPARKLINE } from './sparkline.constants';
import type { SparklineChunk, SparklineGeometry, SparklinePoint } from '../../types/sparkline.types';

export const sparklineFormat = (value: number) => new Intl.NumberFormat(getLocale()).format(value);

export const sparklineIsNumeric = (text: string) => !/\p{L}/u.test(text);

export function sparklineChunks(text: string, isWhole: boolean): SparklineChunk[] {
  if (!text) {
    return [];
  }

  if (isWhole) {
    return [{ slot: 'all', key: text, text }];
  }

  if (sparklineIsNumeric(text)) {
    const chars = Array.from(text);

    return chars.map((char, index) => ({ slot: `n${chars.length - index}`, key: char, text: char }));
  }

  const words = text.split(/(?<=\s)/);

  return words.map((word, index) => ({ slot: `w${index}`, key: words.slice(0, index + 1).join(''), text: word }));
}

export function sparklineCurve(data: number[]): SparklinePoint[] {
  const min = Math.min(...data);
  const span = Math.max(...data) - min;
  const ys = data.map((value) => (span ? (value - min) / span : 0.5));
  const last = ys.length - 1;
  const step = 1 / last;
  const slopes = ys.slice(1).map((y, index) => (y - ys[index]) / step);

  const tangents = ys.map((_, index) => {
    if (index === 0 || index === last) {
      return slopes[0];
    }

    const before = slopes[index - 1];
    const after = slopes[index];

    return (Math.sign(before) + Math.sign(after)) * Math.min(Math.abs(before), Math.abs(after), Math.abs(before + after) / 4) || 0;
  });

  if (last > 1) {
    tangents[0] = (3 * slopes[0] - tangents[1]) / 2;
    tangents[last] = (3 * slopes[last - 1] - tangents[last - 1]) / 2;
  }

  const samples = Math.max(1, Math.min(16, Math.round(128 / last)));
  const points: SparklinePoint[] = [];

  for (let index = 0; index < last; index++) {
    for (let sample = 0; sample < samples; sample++) {
      const t = sample / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const from = (2 * t3 - 3 * t2 + 1) * ys[index] + (t3 - 2 * t2 + t) * step * tangents[index];
      const to = (3 * t2 - 2 * t3) * ys[index + 1] + (t3 - t2) * step * tangents[index + 1];
      const y = from + to;
      points.push([(index + t) * step, Math.min(1, Math.max(0, y))]);
    }
  }

  points.push([1, ys[last]]);

  return points;
}

const sparklineY = (y: number, height: number) => SPARKLINE.inset + (1 - y) * (height - SPARKLINE.inset * 2);

export function sparklineGeometry(curve: SparklinePoint[], width: number, height: number, at: number): SparklineGeometry {
  const points = curve.map(([x, y]): SparklinePoint => [x * width, sparklineY(y, height)]);
  const pairs = points.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`);
  const cx = at * width;
  const cy = sparklineY(chartValueAt(curve, at), height);

  return {
    points,
    line: pairs.join(' '),
    trail: `M${pairs.join('L')}`,
    fill: `M${pairs.join('L')}L${width},${height}L0,${height}Z`,
    dot: `${cx},${cy} ${cx},${cy}`,
    cx,
  };
}

export function sparklineTipAt(points: SparklinePoint[], progress: number) {
  const steps = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
  let left = progress * steps.reduce((sum, step) => sum + step, 0);

  for (const [index, step] of steps.entries()) {
    const from = points[index][0];

    if (left <= step) {
      return from + (points[index + 1][0] - from) * (step ? left / step : 1);
    }

    left -= step;
  }

  return points.at(-1)?.[0] ?? 0;
}

export function sparklineMorph(from: SparklinePoint[], target: SparklinePoint[]) {
  const grid = Array.from({ length: SPARKLINE.grid + 1 }, (_, index) => index / SPARKLINE.grid);
  const xs = [...new Set([...grid, ...target.map(([x]) => x)])].sort((a, b) => a - b);
  const start = xs.map((x) => chartValueAt(from, x));
  const goal = xs.map((x) => chartValueAt(target, x));

  return (progress: number) => xs.map((x, at): SparklinePoint => [x, start[at] + (goal[at] - start[at]) * progress]);
}
