import { alarmActionClear } from './alarm-action.clear';
import { alarmActionSet } from './alarm-action.set';
import type * as AlarmTypes from '../../types/alarm.types';

export function makeAlarmService(): AlarmTypes.AlarmService {
  const deps: AlarmTypes.AlarmServiceDeps = { timers: new Map(), handlers: new Set() };

  return {
    set: (params) => alarmActionSet(deps, params),
    clear: (params) => alarmActionClear(deps, params),
    listen: (handler) => {
      deps.handlers.add(handler);
      return () => {
        deps.handlers.delete(handler);
      };
    },
    close: () => {
      for (const botId of deps.timers.keys()) {
        alarmActionClear(deps, { botId });
      }
      deps.handlers.clear();
    },
  };
}
