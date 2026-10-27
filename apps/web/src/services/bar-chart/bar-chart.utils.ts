import { getLocale } from '@repo/i18n/runtime';
import { match, P } from 'ts-pattern';
import { chartClamp } from '@/services/chart/chart.utils';
import { BAR_CHART } from './bar-chart.constants';
import type * as BarChartTypes from '@/types/bar-chart.types';

export const barChartRowY = (value: number, scale: number) => Math.round(BAR_CHART.height - (value / scale) * (BAR_CHART.height - BAR_CHART.top)) + 0.5;
export const barChartValue = (value: number) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 2 }).format(value);
export const barChartTick = (value: number) => new Intl.NumberFormat(getLocale(), { notation: 'compact', maximumFractionDigits: 1 }).format(value);
export const barChartMean = (value: number) => barChartTick(Math.abs(value) >= 10 ? Math.round(value) : value);

export function barChartNumber(cell: BarChartTypes.BarChartCell | undefined) {
  const value = match(cell)
    .with(P.number, (number) => number)
    .with(P.string.regex(/\S/), (text) => Number(text))
    .otherwise(() => Number.NaN);

  return Number.isFinite(value) ? value : null;
}

export function barChartScale(max: number): BarChartTypes.BarChartScale {
  const safe = max > 0 ? max : 1;
  const magnitude = 10 ** Math.floor(Math.log10(safe / BAR_CHART.rows));
  const step = BAR_CHART.steps.map((factor) => factor * magnitude).find((size) => Math.ceil(safe / size - 1e-9) <= BAR_CHART.rows) ?? safe;
  const rows = Math.ceil(safe / step - 1e-9);
  const barChartRound = (value: number) => Number(value.toPrecision(12));

  return { top: barChartRound(rows * step), ticks: Array.from({ length: rows + 1 }, (_, row) => barChartRound(row * step)) };
}

export function barChartGroup(slot: number, count: number): BarChartTypes.BarChartGroup {
  const group = Math.min(slot * BAR_CHART.fill, count * BAR_CHART.maxBar + (count - 1) * BAR_CHART.gap);
  const gap = count > 1 ? Math.min(BAR_CHART.gap, group / count / 4) : 0;

  return { group, gap, bar: Math.max(0, (group - (count - 1) * gap) / count) };
}

export function barChartPath(x: number, width: number, height: number, base: number) {
  const barChartFixed = (value: number) => value.toFixed(2);

  if (width <= 0 || height <= 0.01) {
    return `M${barChartFixed(x)} ${base}H${barChartFixed(x + Math.max(width, 0))}Z`;
  }

  const r = Math.min(BAR_CHART.radius, width / 2, height);
  const top = base - height;

  const [left, right, inLeft, inRight, peak, shoulder, radius] = [x, x + width, x + r, x + width - r, top, top + r, r].map(barChartFixed);

  return `M${left} ${base}V${shoulder}A${radius} ${radius} 0 0 1 ${inLeft} ${peak}H${inRight}A${radius} ${radius} 0 0 1 ${right} ${shoulder}V${base}Z`;
}

export function barChartLabels(sizes: (number | undefined)[], width: number) {
  const fitting = new Map<number, number>();

  if (!width) {
    return fitting;
  }

  const slot = width / Math.max(1, sizes.length);

  const labels = sizes
    .flatMap((size, index) => (size === undefined ? [] : [{
      index,
      size,
      left: chartClamp((index + 0.5) * slot - size / 2, 0, Math.max(0, width - size)),
    }]))
    .reverse();

  const barChartPicks = (stride: number) => labels.filter((_, rank) => rank % stride === 0);

  const barChartFits = (stride: number) => barChartPicks(stride).every((label, rank, picked) => (
    rank === 0 || label.left + label.size + BAR_CHART.labelGap <= picked[rank - 1].left
  ));

  const stride = Array.from({ length: labels.length }, (_, index) => index + 1).find((value) => value === labels.length || barChartFits(value)) ?? 1;

  barChartPicks(stride).forEach((label) => fitting.set(label.index, label.left));

  return fitting;
}
