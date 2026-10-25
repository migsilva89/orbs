import { match } from 'ts-pattern';
import { alarmActionClear } from './alarm-action.clear';
import { ALARM } from './alarm.constants';
import type * as AlarmTypes from '../../types/alarm.types';

export function alarmActionSet(deps: AlarmTypes.AlarmServiceDeps, { botId, at }: AlarmTypes.AlarmSetParams) {
  alarmActionClear(deps, { botId });
  const delay = Math.max(0, at - Date.now());

  const timer = setTimeout(() => {
    deps.timers.delete(botId);
    match(delay > ALARM.maxTimerDelayMs)
      .with(true, () => alarmActionSet(deps, { botId, at }))
      .with(false, () => {
        for (const handler of deps.handlers) {
          handler({ botId });
        }
      })
      .exhaustive();
  }, Math.min(delay, ALARM.maxTimerDelayMs));

  timer.unref();
  deps.timers.set(botId, timer);
}
