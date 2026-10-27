import { match } from 'ts-pattern';
import { ANIMATED_COUNTER } from './animated-counter.constants';
import type { AnimatedCounterPart } from '../../types/animated-counter.types';

export function animatedCounterParts(value: number, decimals: number, locale: string): AnimatedCounterPart[] {
  const parts = new Intl.NumberFormat(locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    numberingSystem: 'latn',
  }).formatToParts(value);

  let place = parts.reduce((count, part) => count + (part.type === 'integer' ? part.value.length : 0), 0);
  let fraction = 0;
  let order = 0;

  return parts.flatMap((part, index): AnimatedCounterPart[] => {
    if (part.type === 'integer') {
      return part.value.split('').map((char) => ({
        kind: 'digit' as const,
        key: `i${--place}`,
        digit: Number(char),
        order: order++,
      }));
    }

    if (part.type === 'fraction') {
      return part.value.split('').map((char) => ({
        kind: 'digit' as const,
        key: `f${fraction++}`,
        digit: Number(char),
        order: order++,
      }));
    }

    const key = match(part.type)
      .with('group', () => `g${place}`)
      .with('decimal', () => 'd')
      .otherwise((type) => `${type}${index}`);

    return [{ kind: 'symbol', key, text: part.value }];
  });
}

export const animatedCounterText = (parts: AnimatedCounterPart[]) => parts.map((part) => (part.kind === 'symbol' ? part.text : part.digit)).join('');

export const animatedCounterOffset = (digit: number, position: number) => ((((digit - position) % 10) + 15) % 10) - 5;

export const animatedCounterBlur = (offset: number) => {
  const distance = Math.abs(offset);

  return distance < 0.02 || distance >= 1 ? 'none' : `blur(${(distance * ANIMATED_COUNTER.blur).toFixed(2)}px)`;
};

export const animatedCounterTurn = (from: number, to: number, direction: number, isRevealed: boolean) => (
  direction < 0 && isRevealed ? -((from - to + 10) % 10) : (to - from + 10) % 10
);
