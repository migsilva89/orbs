import { ROOMS_SEND_MODES } from '@repo/client/client';
import { useChatDefaults } from '@repo/client/react';
import { usePreferences } from '@repo/client/web';
import { conversationWhenBusy, preferencesEnterAction } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { PanelContent, PanelRow, PanelTitle } from '@repo/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { SettingsGroup } from '@repo/ui/settings/settings-group';
import { useSuspenseQuery } from '@tanstack/react-query';
import { rpc } from '@/services/rpc/rpc.client';

const SETTINGS_ENTER_KEYS = [
  { device: 'desktop', label: m.settings_chat_enter_desktop },
  { device: 'mobile', label: m.settings_chat_enter_mobile },
] as const;

const SETTINGS_ENTER_ACTIONS = { send: m.settings_chat_enter_send, newline: m.settings_chat_enter_newline };

export function SettingsChat() {
  const { preferences, save } = usePreferences();
  const { data: settings } = useSuspenseQuery(rpc.conversation.settings.queryOptions());
  const configure = useChatDefaults();

  return (
    <SettingsGroup title={m.settings_chat()}>
      {SETTINGS_ENTER_KEYS.map((row) => (
        <PanelRow key={row.device}>
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
    </SettingsGroup>
  );
}
