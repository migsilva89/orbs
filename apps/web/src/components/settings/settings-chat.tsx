import { ROOMS_SEND_MODES } from '@repo/client/client';
import { useChatDefaults } from '@repo/client/react';
import { conversationWhenBusy, preferencesEnterAction } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useSuspenseQuery } from '@tanstack/react-query';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { PanelContent, PanelRow, PanelTitle } from '@/components/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreferences } from '@/hooks/use-preferences';
import { rpc } from '@/services/rpc/rpc.client';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconMessageSquare from '~icons/lucide/message-square';
import IconMonitor from '~icons/lucide/monitor';
import IconSmartphone from '~icons/lucide/smartphone';

const SETTINGS_ENTER_KEYS = [
  { device: 'desktop', icon: IconMonitor, label: m.settings_chat_enter_desktop },
  { device: 'mobile', icon: IconSmartphone, label: m.settings_chat_enter_mobile },
] as const;

const SETTINGS_ENTER_ACTIONS = { send: m.settings_chat_enter_send, newline: m.settings_chat_enter_newline };

export function SettingsChat() {
  const { preferences, save } = usePreferences();
  const { data: settings } = useSuspenseQuery(rpc.conversation.settings.queryOptions());
  const configure = useChatDefaults();

  return (
    <SettingsPanel
      icon={IconMessageSquare}
      id="chat"
      title={m.settings_chat()}
    >
      {SETTINGS_ENTER_KEYS.map((row) => (
        <PanelRow key={row.device}>
          <row.icon />
          <PanelContent>
            <PanelTitle>{row.label()}</PanelTitle>
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
        </PanelContent>
        <Select
          disabled={configure.isPending}
          value={settings.whenBusy}
          onValueChange={(value) => configure.configure({ whenBusy: conversationWhenBusy.parse(value) })}
        >
          <SelectTrigger aria-label={m.rooms_send_mode()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {conversationWhenBusy.options.map((mode) => <SelectItem key={mode} value={mode}>{ROOMS_SEND_MODES[mode]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
    </SettingsPanel>
  );
}
