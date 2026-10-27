import { getLocale } from '@repo/i18n/runtime';
import { match, P } from 'ts-pattern';
import { chartClamp, chartValueAt } from '../chart/chart.utils';
import { LINE_CHART } from './line-chart.constants';
import type * as LineChartTypes from '../../types/line-chart.types';

const lineChartClean = (value: number) => Number(value.toPrecision(12));

const lineChartGrid = Array.from({ length: LINE_CHART.morphSteps + 1 }, (_, index) => index / LINE_CHART.morphSteps);

function lineChartNumber(cell: string | number | null | undefined) {
  const value = Number(cell ?? Number.NaN);

  return Number.isFinite(value) ? value : null;
}

function lineChartBridge(cells: (number | null)[]) {
  const known = cells.flatMap((cell, index) => (cell === null ? [] : [{ index, cell }]));

  return cells.map((cell, index) => {
    const before = [...known].reverse().find((point) => point.index < index);
    const after = known.find((point) => point.index > index);

    return match({
      cell,
      before,
      after,
    })
      .with({ cell: P.number }, ({ cell: value }) => value)
      .with({ before: P.nonNullable, after: P.nonNullable }, ({ before: from, after: to }) => (
        from.cell + ((to.cell - from.cell) * (index - from.index)) / (to.index - from.index)
      ))
      .otherwise(() => (before ?? after)?.cell ?? 0);
  });
}

export function lineChartTrackPatch(tracks: Map<string, LineChartTypes.LineChartTrack>, key: string, patch: Partial<LineChartTypes.LineChartTrack>) {
  const track = tracks.get(key);

  if (track) {
    tracks.set(key, { ...track, ...patch });
  }
}

export function lineChartModel(data: LineChartTypes.LineChartRow[], x: string, series: LineChartTypes.LineChartSeries[]): LineChartTypes.LineChartModel {
  const labels = data.map((row) => String(row[x] ?? ''));
  const cells = Object.fromEntries(series.map((line) => [line.key, data.map((row) => lineChartNumber(row[line.key]))]));
  const values = Object.fromEntries(series.map((line) => [line.key, lineChartBridge(cells[line.key])]));
  const signature = [series.map((line) => line.key).join(','), ...labels.map((label, index) => `${label}:${series.map((line) => cells[line.key][index]).join(',')}`)].join(';');

  return { labels, cells, values, signature };
}

export function lineChartNiceScale(low: number, high: number): LineChartTypes.LineChartScale {
  const lo = Math.min(0, low);
  const hi = high > lo ? high : lo + 1;
  const magnitude = 10 ** Math.floor(Math.log10((hi - lo) / LINE_CHART.rows));

  for (const factor of [1, 2, 2.5, 5, 10]) {
    const step = factor * magnitude;
    const bottom = Math.floor(lo / step) * step;
    const top = Math.ceil(hi / step) * step;

    if ((top - bottom) / step <= LINE_CHART.rows + 1e-9) {
      const ticks: number[] = [];

      for (let value = bottom; value <= top + step / 2; value += step) {
        ticks.push(lineChartClean(value));
      }

      return { min: lineChartClean(bottom), max: lineChartClean(top), ticks };
    }
  }

  return { min: lo, max: hi, ticks: [lo, hi] };
}

function lineChartTangents(values: number[], step: number) {
  const last = values.length - 1;
  const slopes = values.slice(1).map((value, index) => (value - values[index]) / step);

  const tangents = values.map((_, index) => {
    if (index === 0 || index === last) {
      return 0;
    }

    const before = slopes[index - 1];
    const after = slopes[index];

    return (Math.sign(before) + Math.sign(after)) * Math.min(Math.abs(before), Math.abs(after), Math.abs(before + after) / 4) || 0;
  });

  if (last > 1) {
    tangents[0] = (3 * slopes[0] - tangents[1]) / 2;
    tangents[last] = (3 * slopes[last - 1] - tangents[last - 1]) / 2;
  } else {
    tangents[0] = slopes[0];
    tangents[1] = slopes[0];
  }

  return tangents;
}

function lineChartCurve(values: number[]): LineChartTypes.LineChartPoint[] {
  if (values.length === 0) {
    return [];
  }

  if (values.length === 1) {
    return [[0, values[0]], [1, values[0]]];
  }

  const last = values.length - 1;
  const step = 1 / last;
  const tangents = lineChartTangents(values, step);
  const samples = Math.max(1, Math.min(LINE_CHART.maxSegmentSamples, Math.round(LINE_CHART.curveSamples / last)));
  const points: LineChartTypes.LineChartPoint[] = [];

  for (let index = 0; index < last; index++) {
    const from = values[index];
    const to = values[index + 1];

    for (let sample = 0; sample < samples; sample++) {
      const t = sample / samples;
      const t2 = t * t;
      const t3 = t2 * t;
      const value = (2 * t3 - 3 * t2 + 1) * from + (t3 - 2 * t2 + t) * step * tangents[index] + (3 * t2 - 2 * t3) * to + (t3 - t2) * step * tangents[index + 1];

      points.push([(index + t) * step, chartClamp(value, Math.min(from, to), Math.max(from, to))]);
    }
  }

  points.push([1, values[last]]);

  return points;
}

export function lineChartMorphPoints(from: LineChartTypes.LineChartPoint[], to: LineChartTypes.LineChartPoint[]) {
  const xs = [...new Set([...lineChartGrid, ...to.map(([x]) => x)])].sort((a, b) => a - b);

  return {
    xs,
    from: xs.map((x) => chartValueAt(from, x)),
    to: xs.map((x) => chartValueAt(to, x)),
  };
}

export function lineChartAxisPicks(count: number, width: number) {
  if (!width || count === 0) {
    return [];
  }

  const stride = Math.ceil(count / Math.max(2, Math.floor(width / LINE_CHART.axisSpacing)));

  return Array.from({ length: count }, (_, index) => count - 1 - index).filter((_, rank) => rank % stride === 0).reverse();
}

export function lineChartFormatters() {
  const locale = getLocale();

  return {
    value: new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }),
    tick: new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 2 }),
  };
}

export function lineChartCurves(model: LineChartTypes.LineChartModel) {
  return new Map(Object.entries(model.values).map(([key, values]) => [key, lineChartCurve(values)]));
}

export function lineChartRange(model: LineChartTypes.LineChartModel, keys: string[]) {
  const values = keys.flatMap((key) => model.values[key] ?? []);

  return values.length === 0 ? null : lineChartNiceScale(Math.min(...values), Math.max(...values));
}
