import { useChatHideVerbose, useNotificationSettings } from '@repo/client/react';
import { notificationPlatform } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Button } from '@repo/ui/button';
import { Label } from '@repo/ui/label';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@repo/ui/panel';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@repo/ui/select';
import { SettingsPanel } from '@repo/ui/settings/settings-panel';
import { Switch } from '@repo/ui/switch';
import { ClientOnly } from '@tanstack/react-router';
import { useId, useState } from 'react';
import IconBellRing from '~icons/lucide/bell-ring';
import IconSettings from '~icons/lucide/settings';
import IconSmartphone from '~icons/lucide/smartphone';
import IconWrench from '~icons/lucide/wrench';
import type { NotificationPlatform } from '@repo/contracts/universal';

const SETTINGS_NOTIFY_PREFER = {
  phone: m.settings_notify_prefer_phone,
  computer: m.settings_notify_prefer_computer,
} satisfies Record<NotificationPlatform, () => string>;

function SettingsGeneralNotifications() {
  const id = useId();

  const [permission, setPermission] = useState(() =>
    Object.hasOwn(globalThis, 'Notification') && !window.__electrobunSendToHost ? Notification.permission : 'granted',
  );

  return (
    <PanelRow>
      <IconBellRing />
      <PanelContent>
        <Label htmlFor={id}>{m.settings_general_notifications()}</Label>
        {permission === 'denied' ? <PanelDescription>{m.settings_general_notifications_blocked()}</PanelDescription> : null}
      </PanelContent>
      <Button
        disabled={permission !== 'default'}
        id={id}
        size="sm"
        variant="outline"
        onClick={() => void Notification.requestPermission().then(setPermission)}
      >
        {permission === 'granted' ? m.settings_general_notifications_on() : m.settings_general_notifications_enable()}
      </Button>
    </PanelRow>
  );
}

export function SettingsGeneral() {
  const verbose = useChatHideVerbose();
  const notify = useNotificationSettings();
  const verboseId = useId();

  return (
    <SettingsPanel
      icon={IconSettings}
      id="general"
      title={m.settings_general()}
    >
      <PanelRow>
        <IconWrench />
        <PanelContent>
          <Label htmlFor={verboseId}>{m.settings_general_verbose()}</Label>
        </PanelContent>
        <Switch
          checked={verbose.hideVerbose}
          disabled={verbose.isPending}
          id={verboseId}
          onCheckedChange={verbose.setHideVerbose}
        />
      </PanelRow>
      <ClientOnly>
        <SettingsGeneralNotifications />
      </ClientOnly>
      <PanelRow>
        <IconSmartphone />
        <PanelContent>
          <PanelTitle>{m.settings_notify_prefer()}</PanelTitle>
        </PanelContent>
        <Select
          disabled={notify.isPending || !notify.prefer}
          value={notify.prefer ?? ''}
          onValueChange={(value) => notify.setPrefer(notificationPlatform.parse(value))}
        >
          <SelectTrigger aria-label={m.settings_notify_prefer()} className="w-auto">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {notificationPlatform.options.map((platform) => <SelectItem key={platform} value={platform}>{SETTINGS_NOTIFY_PREFER[platform]()}</SelectItem>)}
          </SelectContent>
        </Select>
      </PanelRow>
    </SettingsPanel>
  );
}
