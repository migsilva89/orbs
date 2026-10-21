import { useChatShowTools } from '@openbots/client/web';
import { m } from '@openbots/i18n/client';
import { ClientOnly } from '@tanstack/react-router';
import { useId, useState } from 'react';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { PanelContent, PanelDescription, PanelRow } from '@/components/ui/panel';
import { Switch } from '@/components/ui/switch';
import IconBellRing from '~icons/lucide/bell-ring';
import IconSettings from '~icons/lucide/settings';
import IconWrench from '~icons/lucide/wrench';

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
        <PanelDescription>
          {permission === 'denied' ? m.settings_general_notifications_blocked() : m.settings_general_notifications_hint()}
        </PanelDescription>
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
  const tools = useChatShowTools();
  const toolsId = useId();

  return (
    <SettingsPanel
      description={m.settings_general_hint()}
      icon={IconSettings}
      id="general"
      title={m.settings_general()}
    >
      <PanelRow>
        <IconWrench />
        <PanelContent>
          <Label htmlFor={toolsId}>{m.settings_general_tools()}</Label>
          <PanelDescription>{m.settings_general_tools_hint()}</PanelDescription>
        </PanelContent>
        <Switch
          checked={tools.shown}
          id={toolsId}
          onCheckedChange={tools.toggle}
        />
      </PanelRow>
      <ClientOnly>
        <SettingsGeneralNotifications />
      </ClientOnly>
    </SettingsPanel>
  );
}
