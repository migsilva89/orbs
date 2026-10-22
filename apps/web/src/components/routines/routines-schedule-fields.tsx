import { ROUTINES_SCHEDULE_KINDS, routinesScheduleDefault } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useFormContext } from 'react-hook-form';
import { match } from 'ts-pattern';
import { FormControl, FormErrorsAndHint, FormField, FormItem, FormLabel } from '@/components/ui/forms/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { RoutineEditForm, RoutineSchedule } from '@repo/contracts/universal';

export function RoutinesScheduleFields() {
  const form = useFormContext<RoutineEditForm>();

  return (
    <FormField
      control={form.control}
      name="schedule"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{m.rooms_routines_schedule()}</FormLabel>
          <div className="grid gap-2 sm:grid-cols-[8rem_minmax(0,1fr)]">
            <Select
              value={field.value.kind}
              onValueChange={(kind) => field.onChange(routinesScheduleDefault(kind))}
            >
              <SelectTrigger aria-label={m.rooms_routines_schedule()}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ROUTINES_SCHEDULE_KINDS).map(([kind, label]) => <SelectItem key={kind} value={kind}>{label()}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormControl>
              <RoutinesScheduleFieldsInput schedule={field.value} onChange={field.onChange} />
            </FormControl>
          </div>
          <FormErrorsAndHint hint={m.rooms_routines_schedule_hint()} />
        </FormItem>
      )}
    />
  );
}

interface RoutinesScheduleFieldsInputProps {
  schedule: RoutineSchedule
  onChange: (schedule: RoutineSchedule) => void
}

function RoutinesScheduleFieldsInput({ schedule, onChange }: RoutinesScheduleFieldsInputProps) {
  function routinesLocalTime(time: number): string {
    const date = new Date(time);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

    return date.toISOString().slice(0, 16);
  }

  return match(schedule)
    .with({ kind: 'once' }, (once) => (
      <Input
        type="datetime-local"
        value={routinesLocalTime(once.runAt)}
        onChange={(event) => {
          const runAt = new Date(event.target.value).getTime();

          if (Number.isFinite(runAt)) {
            onChange({ ...once, runAt });
          }
        }}
      />
    ))
    .with({ kind: 'interval' }, (interval) => (
      <Input
        aria-label={m.rooms_routines_minutes()}
        min={1}
        type="number"
        value={interval.minutes}
        onChange={(event) => {
          if (Number.isFinite(event.target.valueAsNumber)) {
            onChange({ ...interval, minutes: event.target.valueAsNumber });
          }
        }}
      />
    ))
    .with({ kind: 'cron' }, (cron) => (
      <Input
        aria-label={m.rooms_routines_cron()}
        maxLength={120}
        value={cron.expression}
        onChange={(event) => onChange({ ...cron, expression: event.target.value })}
      />
    ))
    .exhaustive();
}
