import { Errors } from '@openbots/errors/universal';
import { CronExpressionParser } from 'cron-parser';
import { match } from 'ts-pattern';
import type { RoutineSchedule } from '@openbots/contracts/universal';

export function routineNextRunAt(schedule: RoutineSchedule, after: number): number {
  return match(schedule)
    .with({ kind: 'once' }, ({ runAt }) => runAt)
    .with({ kind: 'interval' }, ({ minutes }) => after + minutes * 60_000)
    .with({ kind: 'cron' }, ({ expression, timezone }) => {
      try {
        // Five fields keep cron at minute resolution. Resolve calendars without starting a second scheduler.
        match(expression.split(/\s+/).length === 5 && !/\bH\b/.test(expression))
          .with(true, () => undefined)
          .with(false, () => {
            throw new Error('Invalid cron expression');
          })
          .exhaustive();
        new Intl.DateTimeFormat('en', { timeZone: timezone }).format(after);

        return CronExpressionParser.parse(expression, { currentDate: after, tz: timezone }).next().getTime();
      } catch {
        throw new Errors.VALIDATION_ERROR({ fields: { schedule: { message: 'validation_routine_schedule' } } });
      }
    })
    .exhaustive();
}
