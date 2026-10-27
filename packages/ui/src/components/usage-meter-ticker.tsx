import { animate, AnimatePresence, useMotionValue, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { match } from 'ts-pattern';
import { chartSoon, chartSpring } from '../services/chart/chart.utils';
import { USAGE_METER } from '../services/usage-meter/usage-meter.constants';
import { usageMeterGlyphs } from '../services/usage-meter/usage-meter.utils';
import type { MotionValue } from 'motion/react';

interface UsageMeterGlyphProps {
  position: MotionValue<number>
  digit: number
}

interface UsageMeterColumnProps {
  digit: number
  direction: number
  isReduced: boolean
}

interface UsageMeterTickerProps {
  value: number
  formatter: Intl.NumberFormat
  isReduced: boolean
}

const usageMeterTurn = chartSpring(USAGE_METER.springs.smooth);
const usageMeterFit = chartSpring(USAGE_METER.springs.morph, 0.01);

function UsageMeterGlyph({ position, digit }: UsageMeterGlyphProps) {
  const offset = useTransform(position, (current) => ((((digit - current) % 10) + 15) % 10) - 5);
  const y = useTransform(offset, (current) => `${current}em`);
  const opacity = useTransform(offset, (current) => Math.max(0, 1 - Math.abs(current)));
  const filter = useTransform(offset, (current) => (Math.abs(current) < 0.02 || Math.abs(current) >= 1 ? 'none' : `blur(${(Math.abs(current) * USAGE_METER.blur).toFixed(2)}px)`));

  return <motion.span className="absolute inset-x-0 inset-y-(--feather) text-center" style={{ y, opacity, filter }}>{digit}</motion.span>;
}

function UsageMeterColumn({ digit, direction, isReduced }: UsageMeterColumnProps) {
  const position = useMotionValue(digit);
  const wheel = useRef({ digit, target: digit });
  const running = useRef<(() => void) | null>(null);

  useEffect(() => () => running.current?.(), []);

  useEffect(() => {
    const state = wheel.current;

    if (state.digit === digit) {
      return;
    }

    state.target += direction < 0 ? -((state.digit - digit + 10) % 10) : (digit - state.digit + 10) % 10;
    state.digit = digit;
    running.current?.();

    if (isReduced) {
      position.jump(state.target);
      running.current = null;

      return;
    }

    const { target } = state;
    running.current = chartSoon(() => animate(position, target, usageMeterTurn));
  }, [digit, direction, position, isReduced]);

  return (
    <motion.span
      {...USAGE_METER.column}
      className="relative -my-(--feather) inline-block overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_calc(var(--feather)*1.5),#000_calc(100%-var(--feather)*1.5),transparent)] py-(--feather) [--feather:.16em]"
      transition={isReduced ? { duration: 0 } : usageMeterFit}
    >
      <span className="invisible">0</span>
      {USAGE_METER.digits.map((item) => <UsageMeterGlyph digit={item} key={item} position={position} />)}
    </motion.span>
  );
}

export function UsageMeterTicker({ value, formatter, isReduced }: UsageMeterTickerProps) {
  const [trend, setTrend] = useState({ value, direction: 1 });

  if (trend.value !== value) {
    setTrend({ value, direction: value > trend.value ? 1 : -1 });
  }

  return (
    <span aria-hidden className="relative inline-flex items-start whitespace-nowrap tabular-nums select-none">
      <AnimatePresence initial={false}>
        {usageMeterGlyphs(value, formatter).map((glyph) => match(glyph)
          .with({ kind: 'digit' }, ({ digit, key }) => <UsageMeterColumn digit={digit} direction={trend.direction} isReduced={isReduced} key={key} />)
          .with({ kind: 'text' }, ({ text, key }) => (
            <motion.span {...USAGE_METER.column} className="inline-block overflow-x-clip" key={key} transition={isReduced ? { duration: 0 } : usageMeterFit}>
              {text}
            </motion.span>
          ))
          .exhaustive())}
      </AnimatePresence>
    </span>
  );
}
