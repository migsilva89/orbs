import { useEffect, useEffectEvent } from 'react';
import { useIsStandalone } from '@/hooks/use-is-standalone';
import type { SidebarSwipeOptions } from '@/types/sidebar.types';

const SWIPE_IGNORE = ':is([data-vaul-drawer], [data-vaul-overlay], [role="dialog"]):not([data-state="closed"]), [role="menu"], input, textarea, [contenteditable="true"], pre, table';
const SWIPE_INTERACTIVE = 'a, button, [role="button"]';
const SWIPE = { edgePx: 24, slopPx: 10, ratio: 2 } as const;

export function useSidebarSwipe({ side, enabled, onDrag, onRelease }: SidebarSwipeOptions) {
  const standalone = useIsStandalone();
  const canStart = useEffectEvent(() => enabled);
  const drag = useEffectEvent(onDrag);
  const release = useEffectEvent(onRelease);

  useEffect(() => {
    let start: { x: number; y: number } | null = null;
    let last = { offset: 0, time: 0, velocity: 0 };
    let dragging = false;

    const handleStart = (event: TouchEvent) => {
      const touch = event.touches.item(0);
      const target = event.target instanceof Element ? event.target : null;

      dragging = false;
      start = touch && event.touches.length === 1 && canStart() && !target?.closest(SWIPE_IGNORE) ? { x: touch.clientX, y: touch.clientY } : null;

      const edge = start && (side === 'left' ? start.x : window.innerWidth - start.x);

      if (standalone && edge !== null && edge <= SWIPE.edgePx && !target?.closest(SWIPE_INTERACTIVE)) {
        event.preventDefault();
      }
    };

    const handleMove = (event: TouchEvent) => {
      const touch = event.touches.item(0);

      if (!start || !touch) {
        return;
      }

      const offset = side === 'left' ? touch.clientX - start.x : start.x - touch.clientX;
      const vertical = Math.abs(touch.clientY - start.y);

      if (!dragging) {
        if (Math.max(Math.abs(offset), vertical) < SWIPE.slopPx) {
          return;
        }

        if (offset < vertical * SWIPE.ratio) {
          start = null;

          return;
        }

        dragging = true;
        last = { offset, time: event.timeStamp, velocity: 0 };
      }

      if (event.cancelable) {
        event.preventDefault();
      }

      last = { offset, time: event.timeStamp, velocity: (offset - last.offset) / Math.max(event.timeStamp - last.time, 1) };
      drag(Math.max(offset, 0));
    };

    const handleEnd = (event: TouchEvent) => {
      if (dragging) {
        release(event.type === 'touchcancel' ? { offset: 0, velocity: 0 } : { offset: Math.max(last.offset, 0), velocity: last.velocity });
      }

      start = null;
      dragging = false;
    };

    document.addEventListener('touchstart', handleStart, { passive: !standalone });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('touchcancel', handleEnd);

    return () => {
      document.removeEventListener('touchstart', handleStart);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('touchcancel', handleEnd);
    };
  }, [side, standalone]);
}
