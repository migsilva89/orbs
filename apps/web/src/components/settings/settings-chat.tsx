import { preferencesEnterAction, preferencesWhenBusy } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreferences } from '@/hooks/use-preferences';
import { ROOMS_SEND_MODE_HINTS } from '@/services/rooms/rooms.constants';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconMessageSquare from '~icons/lucide/message-square';
import IconMonitor from '~icons/lucide/monitor';
import IconSmartphone from '~icons/lucide/smartphone';

const SETTINGS_ENTER_KEYS = [
  { device: 'desktop', icon: IconMonitor, label: m.settings_chat_enter_desktop, hint: m.settings_chat_enter_desktop_hint },
  { device: 'mobile', icon: IconSmartphone, label: m.settings_chat_enter_mobile, hint: m.settings_chat_enter_mobile_hint },
] as const;

const SETTINGS_ENTER_ACTIONS = { send: m.settings_chat_enter_send, newline: m.settings_chat_enter_newline };

const SETTINGS_WHEN_BUSY = { followUp: m.rooms_send_queue, steer: m.rooms_send_steer, interrupt: m.rooms_send_interrupt };

export function SettingsChat() {
  const { preferences, save } = usePreferences();

  return (
    <SettingsPanel
      description={m.settings_chat_hint()}
      icon={IconMessageSquare}
      id="chat"
      title={m.settings_chat()}
    >
      {SETTINGS_ENTER_KEYS.map((row) => (
        <PanelRow key={row.device}>
          <row.icon />
          <PanelContent>
            <PanelTitle>{row.label()}</PanelTitle>
            <PanelDescription>{row.hint()}</PanelDescription>
          </PanelContent>
          <Select
            value={preferences.enterKey[row.device]}
            onValueChange={(value) => save({ ...preferences, enterKey: { ...preferences.enterKey, [row.device]: preferencesEnterAction.parse(value) } })}
          >
            <SelectTrigger aria-label={row.label()} className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {preferencesEnterAction.options.map((action) => <SelectItem key={action} value={action}>{SETTINGS_ENTER_ACTIONS[action]()}</SelectItem>)}
            </SelectContent>
          </Select>
        </PanelRow>
      ))}
      <PanelRow>
        <IconListOrdered />
        <PanelContent>
          <PanelTitle>{m.rooms_send_mode()}</PanelTitle>
          <PanelDescription>{ROOMS_SEND_MODE_HINTS[preferences.whenBusy]()}</PanelDescription>
        </PanelContent>
        <Select value={preferences.whenBusy} onValueChange={(value) => save({ ...preferences, whenBusy: preferencesWhenBusy.parse(value) })}>
          <SelectTrigger aria-label={m.rooms_send_mode()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {preferencesWhenBusy.options.map((mode) => <SelectItem key={mode} value={mode}>{SETTINGS_WHEN_BUSY[mode]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
    </SettingsPanel>
  );
}
