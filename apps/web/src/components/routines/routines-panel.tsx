import { m } from '@openbots/i18n/client';
import { RoutinesList } from '@/components/routines/routines-list';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { PanelRow } from '@/components/ui/panel';
import IconCalendarClock from '~icons/lucide/calendar-clock';
import type { Bot } from '@openbots/contracts/universal';

interface RoutinesPanelProps {
  bot: Bot
}

export function RoutinesPanel({ bot }: RoutinesPanelProps) {
  return (
    <SettingsPanel
      description={m.bots_routines_hint()}
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
