import { match, P } from 'ts-pattern';
import { ACTIVITY_HEATMAP } from './activity-heatmap.constants';
import type * as ActivityHeatmapTypes from '../../types/activity-heatmap.types';

const activityHeatmapUtc = (iso: string) => Date.parse(`${iso}T00:00:00Z`);
export const activityHeatmapIso = (time: number) => new Date(time).toISOString().slice(0, 10);

export const activityHeatmapColumn = (col: number): ActivityHeatmapTypes.ActivityHeatmapStyle => ({ '--col': col });

export function activityHeatmapDirection(delta: number): ActivityHeatmapTypes.ActivityHeatmapChange {
  return match(delta)
    .with(P.number.gt(0), () => 1 as const)
    .with(P.number.lt(0), () => -1 as const)
    .otherwise(() => 0 as const);
}

function activityHeatmapLevel(value: number, [a, b, c]: [number, number, number]) {
  return match(value)
    .with(P.number.lte(0), () => 0)
    .with(P.number.lte(a), () => 1)
    .with(P.number.lte(b), () => 2)
    .with(P.number.lte(c), () => 3)
    .otherwise(() => 4);
}

export function activityHeatmapModel(days: ActivityHeatmapTypes.ActivityHeatmapDay[], locale: string): ActivityHeatmapTypes.ActivityHeatmapModel {
  const { day, week } = ACTIVITY_HEATMAP;
  const dates = days.map((item) => activityHeatmapUtc(item.date)).filter(Number.isFinite);
  const start = dates.length > 0 ? Math.min(...dates) : 0;
  const length = dates.length > 0 ? Math.round((Math.max(...dates) - start) / day) + 1 : 0;
  const values = Array.from({ length }, () => 0);

  days.forEach((item) => {
    const index = Math.round((activityHeatmapUtc(item.date) - start) / day);

    if (index >= 0 && index < length) {
      values[index] += Math.max(0, item.value);
    }
  });

  const max = Math.max(0, ...values);
  const thresholds: [number, number, number] = [Math.max(1, Math.ceil(max * 0.25)), Math.max(2, Math.ceil(max * 0.5)), Math.max(3, Math.ceil(max * 0.75))];
  const levels = values.map((value) => activityHeatmapLevel(value, thresholds));
  const lead = new Date(start).getUTCDay();
  const weeks = Math.ceil((lead + length) / week);
  const monthName = new Intl.DateTimeFormat(locale, { month: 'short', timeZone: 'UTC' });

  const months = values.flatMap((_, index) => {
    const date = new Date(start + index * day);

    return index === 0 || date.getUTCDate() === 1
      ? [{ key: `${date.getUTCFullYear()}-${date.getUTCMonth()}`, col: Math.floor((lead + index) / week), label: monthName.format(date) }]
      : [];
  });

  const shownMonths = months.length > 1 && months[1].col - months[0].col < 3 ? months.slice(1) : months;
  const perLevel = ACTIVITY_HEATMAP.levels.map((level) => levels.filter((item) => item === level).length);

  return {
    start,
    length,
    lead,
    weeks,
    total: values.reduce((sum, value) => sum + value, 0),
    values,
    levels,
    thresholds,
    months: shownMonths,
    perLevel,
  };
}
