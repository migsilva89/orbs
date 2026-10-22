import { m } from '@repo/i18n/client';
import { useEffect, useState } from 'react';
import { useIsStandalone } from '@/hooks/use-is-standalone';
import { LAYOUT_PULL_REFRESH } from '@/services/layout/layout.constants';
import IconRotateCw from '~icons/lucide/rotate-cw';

export function LayoutPullToRefresh() {
  const standalone = useIsStandalone();
  const [distance, setDistance] = useState(0);

  useEffect(() => {
    if (!standalone) {
      return;
    }

    let start: Touch | null = null;
    let pulled = 0;

    function layoutCancelPull() {
      start = null;
      pulled = 0;
      setDistance(0);
    }

    function layoutStartPull(event: TouchEvent) {
      layoutCancelPull();

      if (event.touches.length !== 1 || !(event.target instanceof Element)
        || event.target.closest(LAYOUT_PULL_REFRESH.ignore)
        || document.querySelector('[role="dialog"], [role="menu"]')
        || (window.visualViewport && window.visualViewport.scale !== 1)) {
        return;
      }

      const touch = event.touches.item(0);
      const fromTop = touch !== null && touch.clientY <= LAYOUT_PULL_REFRESH.topEdge;

      for (let element: Element | null = event.target; element && !fromTop; element = element.parentElement) {
        if (element.scrollTop > 0) {
          return;
        }
      }

      start = touch;
    }

    function layoutMovePull(event: TouchEvent) {
      const touch = event.touches.item(0);

      if (!start || !touch) {
        return;
      }

      const dx = Math.abs(touch.clientX - start.clientX);
      const dy = touch.clientY - start.clientY;

      if (event.touches.length !== 1 || dy < 0 || dx > Math.abs(dy) || !event.cancelable) {
        layoutCancelPull();

        return;
      }

      event.preventDefault();
      pulled = dy;
      setDistance(Math.min(dy, LAYOUT_PULL_REFRESH.threshold * 1.5));
    }

    function layoutEndPull() {
      const refresh = pulled >= LAYOUT_PULL_REFRESH.threshold;
      layoutCancelPull();

      if (refresh) {
        window.location.reload();
      }
    }

    document.addEventListener('touchstart', layoutStartPull, { passive: true });
    document.addEventListener('touchmove', layoutMovePull, { passive: false });
    document.addEventListener('touchend', layoutEndPull);
    document.addEventListener('touchcancel', layoutCancelPull);

    return () => {
      document.removeEventListener('touchstart', layoutStartPull);
      document.removeEventListener('touchmove', layoutMovePull);
      document.removeEventListener('touchend', layoutEndPull);
      document.removeEventListener('touchcancel', layoutCancelPull);
    };
  }, [standalone]);

  if (!standalone || distance === 0) {
    return null;
  }

  return (
    <output
      className="pointer-events-none fixed top-(--app-top) left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-popover px-3 py-2 text-xs text-popover-foreground shadow-sm"
      style={{ transform: `translateY(${distance / 2}px)` }}
    >
      <IconRotateCw aria-hidden="true" className="size-4" />
      {distance >= LAYOUT_PULL_REFRESH.threshold ? m.layout_release_refresh() : m.layout_pull_refresh()}
    </output>
  );
}
