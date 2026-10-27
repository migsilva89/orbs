import { getLocale } from '@repo/i18n/runtime';
import { DONUT_CHART } from './donut-chart.constants';
import type * as DonutChartTypes from '@/types/donut-chart.types';

export const donutChartRound = (value: number) => (Math.round(value * 100) / 100).toString();
export const donutChartValue = (value: number) => new Intl.NumberFormat(getLocale(), { maximumFractionDigits: 1 }).format(value);

export function donutChartShare(share: number) {
  const percent = new Intl.NumberFormat(getLocale(), { style: 'percent', maximumFractionDigits: 0 });

  return share > 0 && share < 0.01 ? `<${percent.format(0.01)}` : percent.format(share);
}

export function donutChartLayout(slices: DonutChartTypes.DonutChartSlice[]) {
  const total = slices.reduce((sum, item) => sum + item.value, 0) || 1;
  const ends = slices.map((_, index) => slices.slice(0, index + 1).reduce((sum, item) => sum + item.value, 0) / total);

  return new Map(slices.map((item, index) => [item.key, { start: ends[index - 1] ?? 0, end: ends[index] }]));
}

export function donutChartBreadth(R: number, t0: number, t1: number) {
  const turns = t1 - t0;

  if (turns >= 1 - 1e-6) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.sin(Math.min(turns * Math.PI, Math.PI / 2)) * R - Math.min(DONUT_CHART.gap / 2, ((1 - turns) * DONUT_CHART.tau * R) / 2);
}

export function donutChartTurn(x: number, y: number) {
  const turn = (Math.atan2(y, x) + Math.PI / 2) / DONUT_CHART.tau;

  return turn < 0 ? turn + 1 : turn;
}

export function donutChartSector(c: number, R: number, r: number, t0: number, t1: number, corner: number) {
  const turns = t1 - t0;
  const n2 = donutChartRound;
  const donutChartAt = (radius: number, angle: number) => `${n2(c + radius * Math.cos(angle))} ${n2(c + radius * Math.sin(angle))}`;

  if (turns <= 1e-6) {
    return '';
  }

  if (turns >= 1 - 1e-6) {
    const donutChartRing = (radius: number, sweep: number) => {
      const arc = `A${n2(radius)} ${n2(radius)} 0 1 ${sweep}`;

      return `M${donutChartAt(radius, -Math.PI / 2)}${arc} ${donutChartAt(radius, Math.PI / 2)}${arc} ${donutChartAt(radius, -Math.PI / 2)}Z`;
    };

    return `${donutChartRing(R, 1)}${donutChartRing(r, 0)}`;
  }

  const p = Math.min(DONUT_CHART.gap / 2, ((1 - turns) * DONUT_CHART.tau * R) / 2);
  const a0 = t0 * DONUT_CHART.tau - Math.PI / 2;
  const a1 = t1 * DONUT_CHART.tau - Math.PI / 2;
  const s = Math.sin(Math.min((a1 - a0) / 2, Math.PI / 2));

  if (s * R <= p + 1e-6) {
    return '';
  }

  const donutChartSide = (t: number, angle: number, sign: number) => {
    const x = c + t * Math.cos(angle) - sign * p * Math.sin(angle);
    const y = c + t * Math.sin(angle) + sign * p * Math.cos(angle);

    return `${n2(x)} ${n2(y)}`;
  };

  const band = (R - r) / 2;
  const isHalf = s >= 0.9999;
  const ro = Math.max(0, Math.min(corner, band, isHalf ? Number.POSITIVE_INFINITY : (s * R - p) / (1 + s)));
  const dO = Math.asin(Math.min(1, (p + ro) / (R - ro)));
  const tO = Math.sqrt(Math.max(0, (R - ro) ** 2 - (p + ro) ** 2));
  const bigO = a1 - a0 - 2 * dO > Math.PI ? 1 : 0;

  const outer = [
    `M${donutChartSide(tO, a0, 1)}`,
    ro > 0.01 ? `A${n2(ro)} ${n2(ro)} 0 0 1 ${donutChartAt(R, a0 + dO)}` : '',
    `A${n2(R)} ${n2(R)} 0 ${bigO} 1 ${donutChartAt(R, a1 - dO)}`,
    ro > 0.01 ? `A${n2(ro)} ${n2(ro)} 0 0 1 ${donutChartSide(tO, a1, -1)}` : '',
  ];

  if (!(s * r > p + 1e-6 || isHalf)) {
    return `${outer.join('')}L${donutChartAt(p / s, (a0 + a1) / 2)}Z`;
  }

  const ri = Math.max(0, Math.min(corner, band, isHalf ? Number.POSITIVE_INFINITY : (s * r - p) / (1 - s)));
  const dI = Math.asin(Math.min(1, (p + ri) / (r + ri)));
  const tI = Math.sqrt(Math.max(0, (r + ri) ** 2 - (p + ri) ** 2));
  const bigI = a1 - a0 - 2 * dI > Math.PI ? 1 : 0;

  const inner = [
    `L${donutChartSide(tI, a1, -1)}`,
    ri > 0.01 ? `A${n2(ri)} ${n2(ri)} 0 0 1 ${donutChartAt(r, a1 - dI)}` : '',
    `A${n2(r)} ${n2(r)} 0 ${bigI} 0 ${donutChartAt(r, a0 + dI)}`,
    ri > 0.01 ? `A${n2(ri)} ${n2(ri)} 0 0 1 ${donutChartSide(tI, a0, 1)}` : '',
  ];

  return `${outer.join('')}${inner.join('')}Z`;
}
