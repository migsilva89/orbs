import { chartAmount } from '@/services/chart/chart.utils';
import { METRIC_CARD } from './metric-card.constants';
import type { MetricCardNumber, MetricCardTrend } from '@/types/metric-card.types';

export function metricCardTrend(change: string): MetricCardTrend | undefined {
  if (change.startsWith('+')) {
    return 'up';
  }

  return /^[-−]/.test(change) ? 'down' : undefined;
}

export function metricCardNumber(value: number | string): MetricCardNumber | null {
  const text = String(value).trim();

  if (!METRIC_CARD.numeric.test(text)) {
    return null;
  }

  const decimals = text.includes('.') ? text.length - text.indexOf('.') - 1 : 0;

  return { amount: chartAmount(text), decimals: Math.min(METRIC_CARD.maxDecimals, decimals) };
}
