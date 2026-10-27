import { m } from '@repo/i18n/client';
import { PanelRow } from '@repo/ui/panel';
import { SettingsPanel } from '@repo/ui/settings/settings-panel';
import { RoutinesList } from '@/components/routines/routines-list';
import IconCalendarClock from '~icons/lucide/calendar-clock';
import type { Bot } from '@repo/contracts/universal';

interface RoutinesPanelProps {
  bot: Bot
}

export function RoutinesPanel({ bot }: RoutinesPanelProps) {
  return (
    <SettingsPanel
      icon={IconCalendarClock}
      id="routines"
      title={m.rooms_routines()}
    >
      <PanelRow className="flex-col items-stretch">
        <RoutinesList bot={bot} />
      </PanelRow>
    </SettingsPanel>
  );
}
