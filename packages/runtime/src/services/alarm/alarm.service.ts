import { match } from 'ts-pattern';
import { ALARM } from './alarm.constants';
import type * as AlarmTypes from '../../types/alarm.types';

/** Native alarm: one timer per bot. Long delays wait in steps; firing calls every listener. */
export function makeAlarmService(): AlarmTypes.AlarmService {
  const timers = new Map<string, ReturnType<typeof setTimeout>>();
  const handlers = new Set<AlarmTypes.AlarmHandler>();

  const clear = ({ botId }: AlarmTypes.AlarmBotParams) => {
    clearTimeout(timers.get(botId));
    timers.delete(botId);
  };

  const set = ({ botId, at }: AlarmTypes.AlarmSetParams) => {
    clear({ botId });
    const delay = Math.max(0, at - Date.now());

    const timer = setTimeout(() => {
      timers.delete(botId);
      match(delay > ALARM.maxTimerDelayMs)
        .with(true, () => set({ botId, at }))
        .with(false, () => {
          for (const handler of handlers) {
            handler({ botId });
          }
        })
        .exhaustive();
    }, Math.min(delay, ALARM.maxTimerDelayMs));

    timer.unref();
    timers.set(botId, timer);
  };

  return {
    set,
    clear,
    listen: (handler) => {
      handlers.add(handler);
      return () => {
        handlers.delete(handler);
      };
    },
    close: () => {
      for (const botId of timers.keys()) {
        clear({ botId });
      }
      handlers.clear();
    },
  };
}
