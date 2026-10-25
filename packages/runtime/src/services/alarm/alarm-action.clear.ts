import type * as AlarmTypes from '../../types/alarm.types';

export function alarmActionClear({ timers }: AlarmTypes.AlarmServiceDeps, { botId }: AlarmTypes.AlarmBotParams) {
  clearTimeout(timers.get(botId));
  timers.delete(botId);
}
