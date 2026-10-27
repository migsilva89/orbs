import { match, P } from 'ts-pattern';
import { USAGE_METER } from './usage-meter.constants';
import type * as UsageMeterTypes from '@/types/usage-meter.types';

export function usageMeterDecimals(values: number[]) {
  return Math.max(0, ...values.map((value) => Math.min(2, String(value).split('.')[1]?.length ?? 0)));
}

export function usageMeterStatus(used: number, total: number): UsageMeterTypes.UsageMeterStatus {
  return match(used)
    .with(P.number.gt(total), () => 'over' as const)
    .with(P.number.gte(total * USAGE_METER.warnAt), () => 'near' as const)
    .otherwise(() => 'ok' as const);
}

export function usageMeterGlyphs(value: number, formatter: Intl.NumberFormat): UsageMeterTypes.UsageMeterGlyph[] {
  const parts = formatter.formatToParts(value);
  let place = parts.reduce((count, part) => count + (part.type === 'integer' ? part.value.length : 0), 0);
  let fraction = 0;

  return parts.flatMap((part, index): UsageMeterTypes.UsageMeterGlyph[] => match(part.type)
    .with('integer', () => part.value.split('').map((char) => {
      place -= 1;
      return { kind: 'digit' as const, key: `i${place}`, digit: Number(char) };
    }))
    .with('fraction', () => part.value.split('').map((char) => {
      fraction += 1;
      return { kind: 'digit' as const, key: `f${fraction}`, digit: Number(char) };
    }))
    .with('group', () => [{ kind: 'text' as const, key: `g${place}`, text: part.value }])
    .with('decimal', () => [{ kind: 'text' as const, key: 'd', text: part.value }])
    .otherwise(() => [{ kind: 'text' as const, key: `${part.type}${index}`, text: part.value }]));
}
