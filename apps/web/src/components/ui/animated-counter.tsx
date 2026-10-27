import { getLocale } from '@repo/i18n/runtime';
import { useHydrated } from '@tanstack/react-router';
import { animate, AnimatePresence, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react';
import * as motion from 'motion/react-m';
import { useEffect, useRef, useState } from 'react';
import { ANIMATED_COUNTER } from '@/services/animated-counter/animated-counter.constants';
import {
  animatedCounterBlur,
  animatedCounterOffset,
  animatedCounterParts,
  animatedCounterText,
  animatedCounterTurn,
} from '@/services/animated-counter/animated-counter.utils';
import type { MotionValue } from 'motion/react';

interface AnimatedCounterProps {
  value: number
  label?: string
  prefix?: string
  suffix?: string
  decimals?: number
  /** Roll every digit up from zero the first time the counter scrolls into view. */
  animateOnView?: boolean
  /** Formatting locale. Defaults to the app locale so server and client render the same digits. */
  locale?: string
}

interface AnimatedCounterGlyphProps {
  position: MotionValue<number>
  digit: number
}

interface AnimatedCounterColumnProps {
  digit: number
  direction: number
  isArmed: boolean
  delay: number
  isReduced: boolean
}

/** One digit on the wheel. Its offset from the wheel position decides where it sits and how visible it is. */
function AnimatedCounterGlyph({ position, digit }: AnimatedCounterGlyphProps) {
  const offset = useTransform(position, (current) => animatedCounterOffset(digit, current));
  const y = useTransform(offset, (current) => `${current}em`);
  const opacity = useTransform(offset, (current) => Math.max(0, 1 - Math.abs(current)));
  const visibility = useTransform(offset, (current) => (Math.abs(current) >= 1 ? 'hidden' : 'visible'));
  const filter = useTransform(offset, animatedCounterBlur);

  return <motion.span className="absolute inset-x-0 inset-y-[0.16em] text-center" style={{ y, opacity, filter, visibility }}>{digit}</motion.span>;
}

/** A digit wheel. It turns in the direction the whole number moved, wrapping 9 to 0 like an odometer, and feathers out at its edges. */
function AnimatedCounterColumn({ digit, direction, isArmed, delay, isReduced }: AnimatedCounterColumnProps) {
  const start = isArmed ? 0 : digit;
  const position = useMotionValue(start);

  const wheel = useRef({
    digit: start,
    target: start,
    isRevealed: !isArmed,
  });

  useEffect(() => {
    const state = wheel.current;

    if (isArmed || state.digit === digit) {
      state.isRevealed ||= !isArmed;
      return;
    }

    state.target += animatedCounterTurn(state.digit, digit, direction, state.isRevealed);
    state.digit = digit;

    if (isReduced) {
      position.jump(state.target);
    } else {
      const transition = state.isRevealed ? ANIMATED_COUNTER.spring.smooth : { ...ANIMATED_COUNTER.spring.reveal, delay };
      animate(position, state.target, transition);
    }

    state.isRevealed = true;
  }, [isArmed, delay, digit, direction, position, isReduced]);

  return (
    <motion.span
      {...ANIMATED_COUNTER.presence}
      className="relative -my-[0.16em] inline-block overflow-hidden mask-[linear-gradient(to_bottom,transparent,#000_0.24em,#000_calc(100%-0.24em),transparent)] py-[0.16em]"
      transition={isReduced ? { duration: 0 } : ANIMATED_COUNTER.spring.morph}
    >
      <span className="invisible">0</span>
      {ANIMATED_COUNTER.digits.map((item) => <AnimatedCounterGlyph digit={item} key={item} position={position} />)}
    </motion.span>
  );
}

export function AnimatedCounter({ value, label, prefix = '', suffix = '', decimals = 0, animateOnView = false, locale }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, amount: ANIMATED_COUNTER.inView });
  const isHydrated = useHydrated();
  const prefersReduced = useReducedMotion();
  const isReduced = isHydrated && Boolean(prefersReduced);
  const [previous, setPrevious] = useState(value);
  const [direction, setDirection] = useState(1);

  if (value !== previous) {
    setPrevious(value);
    setDirection(value > previous ? 1 : -1);
  }

  const parts = animatedCounterParts(value, decimals, locale ?? getLocale());
  const isArmed = animateOnView && !isInView;
  const presence = isReduced ? { duration: 0 } : ANIMATED_COUNTER.spring.morph;

  return (
    <span className="relative inline-flex flex-col text-4xl leading-none font-medium tracking-[-0.03em] text-foreground tabular-nums" ref={ref}>
      {label ? (
        <span className="mb-2 text-xs leading-[1.4] font-normal tracking-[-0.01em] text-muted-foreground/80">
          <span className="relative block">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                animate="shown"
                className="inline-block"
                exit="gone"
                initial="hidden"
                key={label}
                variants={isReduced ? ANIMATED_COUNTER.fade : ANIMATED_COUNTER.rise}
              >
                {label}
              </motion.span>
            </AnimatePresence>
          </span>
        </span>
      ) : null}
      <span className="sr-only">{`${prefix}${animatedCounterText(parts)}${suffix}`}</span>
      <span aria-hidden className="inline-flex items-start whitespace-nowrap select-none">
        {prefix ? <span className="inline-block overflow-x-clip">{prefix}</span> : null}
        <AnimatePresence initial={false}>
          {parts.map((part) => (part.kind === 'digit' ? (
            <AnimatedCounterColumn
              delay={Math.min(part.order * ANIMATED_COUNTER.stagger, ANIMATED_COUNTER.staggerMax)}
              digit={part.digit}
              direction={direction}
              isArmed={isArmed}
              isReduced={isReduced}
              key={part.key}
            />
          ) : (
            <motion.span {...ANIMATED_COUNTER.presence} className="inline-block overflow-x-clip" key={part.key} transition={presence}>
              {part.text}
            </motion.span>
          )))}
        </AnimatePresence>
        {suffix ? <span className="inline-block overflow-x-clip">{suffix}</span> : null}
      </span>
    </span>
  );
}
