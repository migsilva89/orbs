import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

const LONG_PRESS = { delayMs: 450, tolerancePx: 8 } as const;

export function useLongPress(onLongPress: (element: HTMLElement) => void) {
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const origin = useRef({ x: 0, y: 0 });
  const touching = useRef(false);

  const cancel = () => {
    touching.current = false;
    clearTimeout(timer.current);
  };

  return {
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      const inside = event.target instanceof Node && event.currentTarget.contains(event.target);

      if (event.pointerType !== 'touch' || !inside) {
        return;
      }

      touching.current = true;
      origin.current = { x: event.clientX, y: event.clientY };
      const element = event.currentTarget;
      timer.current = setTimeout(() => onLongPress(element), LONG_PRESS.delayMs);
    },
    onPointerMove: (event: PointerEvent) => {
      if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > LONG_PRESS.tolerancePx) {
        cancel();
      }
    },
    onPointerUp: cancel,
    onPointerCancel: cancel,
    onContextMenu: (event: MouseEvent) => {
      if (touching.current) {
        event.preventDefault();
      }
    },
  };
}
