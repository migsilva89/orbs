import { m } from '@openbots/i18n/client';
import type { RoutineSchedule } from '@openbots/contracts/universal';

export const ROUTINES_SCHEDULE_KINDS = {
  once: m.rooms_routines_kind_once,
  interval: m.rooms_routines_kind_interval,
  cron: m.rooms_routines_kind_cron,
} satisfies Record<RoutineSchedule['kind'], () => string>;

export const ROUTINES = {
  minutesPerHour: 60,
  weekdays: '1-5',
  anchorYear: 2000,
  anchorSunday: 2,
} as const;
