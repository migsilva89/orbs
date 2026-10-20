import { ROOMS_SEND_MODE_HINTS, ROOMS_SEND_MODES } from '@openbots/client/client';
import { conversationWhenBusy, preferencesEnterAction } from '@openbots/contracts/universal';
import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePreferences } from '@/hooks/use-preferences';
import { rpc } from '@/services/rpc/rpc.client';
import IconListOrdered from '~icons/lucide/list-ordered';
import IconMessageSquare from '~icons/lucide/message-square';
import IconMonitor from '~icons/lucide/monitor';
import IconSmartphone from '~icons/lucide/smartphone';

const SETTINGS_ENTER_KEYS = [
  { device: 'desktop', icon: IconMonitor, label: m.settings_chat_enter_desktop, hint: m.settings_chat_enter_desktop_hint },
  { device: 'mobile', icon: IconSmartphone, label: m.settings_chat_enter_mobile, hint: m.settings_chat_enter_mobile_hint },
] as const;

const SETTINGS_ENTER_ACTIONS = { send: m.settings_chat_enter_send, newline: m.settings_chat_enter_newline };

export function SettingsChat() {
  const { preferences, save } = usePreferences();
  const queryClient = useQueryClient();
  const { data: settings } = useSuspenseQuery(rpc.conversation.settings.queryOptions());

  const configure = useMutation(rpc.conversation.configure.mutationOptions({
    onSuccess: (saved) => queryClient.setQueryData(rpc.conversation.settings.queryKey(), saved),
  }));

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
          <PanelDescription>{ROOMS_SEND_MODE_HINTS[settings.whenBusy]()}</PanelDescription>
        </PanelContent>
        <Select
          disabled={configure.isPending}
          value={settings.whenBusy}
          onValueChange={(value) => configure.mutate({ whenBusy: conversationWhenBusy.parse(value) })}
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
