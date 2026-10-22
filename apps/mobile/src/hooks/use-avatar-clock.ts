import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';

const FRAME_SECONDS = 1 / 30;

export function useAvatarClock(animate: boolean) {
  const reducedMotion = useReducedMotion();
  const [isActive, setIsActive] = useState(AppState.currentState === 'active');
  const [clock, setClock] = useState(0);
  const isMoving = animate && isActive && !reducedMotion;

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => setIsActive(state === 'active'));

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isMoving) {
      return;
    }

    let frame = 0;
    let last = 0;
    let drawn = 0;

    const tick = (ms: number) => {
      frame = requestAnimationFrame(tick);
      drawn += last ? Math.min((ms - last) / 1000, 0.064) : 0;
      last = ms;

      if (drawn >= FRAME_SECONDS) {
        setClock((seconds) => seconds + drawn);
        drawn = 0;
      }
    };

    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [isMoving]);

  return animate && !reducedMotion ? clock : null;
}
