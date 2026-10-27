import { chartClamp } from '../chart/chart.utils';
import { GAUGE } from './gauge.constants';

function gaugePoint(angle: number) {
  const radians = (angle * Math.PI) / 180;

  return `${(50 + GAUGE.radius * Math.sin(radians)).toFixed(3)} ${(50 - GAUGE.radius * Math.cos(radians)).toFixed(3)}`;
}

export function gaugeArc(sweep: number) {
  const end = GAUGE.start + GAUGE.span * chartClamp(sweep, 0, 1);

  return `M ${gaugePoint(GAUGE.start)} A ${GAUGE.radius} ${GAUGE.radius} 0 ${end - GAUGE.start > 180 ? 1 : 0} 1 ${gaugePoint(end)}`;
}

export function gaugeDecimals(value: number) {
  const [, fraction = ''] = String(value).split('.');

  return Math.min(2, fraction.length);
}
