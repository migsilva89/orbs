import { DatePicker, Host } from '@expo/ui/swift-ui';
import { ROUTINES_SCHEDULE_KINDS, routinesScheduleDefault } from '@openbots/client/client';
import { m } from '@openbots/i18n/client';
import { ChevronsUpDown } from 'lucide-react-native';
import { useController, useFormContext } from 'react-hook-form';
import { View } from 'react-native';
import { match } from 'ts-pattern';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Label, LabelDescription } from '@/components/ui/label';
import { Menu } from '@/components/ui/menu';
import { Text } from '@/components/ui/text';
import type { RoutineEditForm } from '@openbots/contracts/universal';

interface RoutinesScheduleFieldProps {
  isDisabled: boolean;
}

export function RoutinesScheduleField({ isDisabled }: RoutinesScheduleFieldProps) {
  const { control } = useFormContext<RoutineEditForm>();
  const { field, fieldState } = useController({ control, name: 'schedule' });
  const schedule = field.value;

  return (
    <View className="gap-2">
      <Label invalid={Boolean(fieldState.error)}>{m.rooms_routines_schedule()}</Label>
      <View className="flex-row items-center gap-2">
        <Menu
          isDisabled={isDisabled}
          items={Object.entries(ROUTINES_SCHEDULE_KINDS).map(([kind, label]) => ({
            label: label(),
            systemImage: kind === schedule.kind ? 'checkmark' : undefined,
            onSelect: () => field.onChange(routinesScheduleDefault(kind)),
          }))}
        >
          <View className="h-10 flex-row items-center gap-1 rounded-md border border-input px-3">
            <Text variant="body">{ROUTINES_SCHEDULE_KINDS[schedule.kind]()}</Text>
            <Icon
              icon={ChevronsUpDown}
              size="sm"
              tone="muted"
            />
          </View>
        </Menu>
        <View className="flex-1">
          {match(schedule)
            .with({ kind: 'once' }, (once) => (
              <Host matchContents>
                <DatePicker
                  displayedComponents={['date', 'hourAndMinute']}
                  selection={new Date(once.runAt)}
                  onDateChange={(date) => field.onChange({ ...once, runAt: date.getTime() })}
                />
              </Host>
            ))
            .with({ kind: 'interval' }, (interval) => (
              <Input
                accessibilityLabel={m.rooms_routines_minutes()}
                editable={!isDisabled}
                keyboardType="number-pad"
                value={String(interval.minutes)}
                onChangeText={(text) => field.onChange({ ...interval, minutes: Number(text) })}
              />
            ))
            .with({ kind: 'cron' }, (cron) => (
              <Input
                accessibilityLabel={m.rooms_routines_cron()}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDisabled}
                maxLength={120}
                value={cron.expression}
                onChangeText={(expression) => field.onChange({ ...cron, expression })}
              />
            ))
            .exhaustive()}
        </View>
      </View>
      <LabelDescription variant={fieldState.error ? 'error' : undefined}>{fieldState.error ? m.rooms_routines_save_failed() : m.rooms_routines_schedule_hint()}</LabelDescription>
    </View>
  );
}
