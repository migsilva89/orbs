import { useEffect, useRef, useState } from 'react';
import { BOT_CHEER } from '@/services/bot/bot.constants';
import type { PointerEvent } from 'react';

export function useBotCheer() {
  const [moving, setMoving] = useState(false);
  const [happy, setHappy] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  const later = (delayMs: number, step: () => void) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(step, delayMs);
  };

  const settle = () => {
    setHappy(false);
    later(BOT_CHEER.settleMs, () => setMoving(false));
  };

  const cheer = (thenSettleAfterMs?: number) => {
    setMoving(true);
    requestAnimationFrame(() => setHappy(true));

    if (thenSettleAfterMs) {
      later(thenSettleAfterMs, settle);
    } else {
      clearTimeout(timer.current);
    }
  };

  return {
    moving,
    happy,
    handlers: {
      onPointerEnter: (event: PointerEvent) => {
        if (event.pointerType === 'mouse') {
          later(BOT_CHEER.hoverDelayMs, () => cheer());
        }
      },
      onPointerLeave: settle,
      onClick: () => cheer(BOT_CHEER.pressMs),
    },
  };
}
