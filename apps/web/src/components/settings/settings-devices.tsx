import { useSettingsDevices } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { Link, useHydrated } from '@tanstack/react-router';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui/button-loading';
import { FormErrors } from '@/components/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { toasty } from '@/components/ui/sonner';
import { clipboardCopy } from '@/lib/clipboard';
import IconCopy from '~icons/lucide/copy';
import IconLaptop from '~icons/lucide/laptop';
import IconQrCode from '~icons/lucide/qr-code';
import type { ConnectionInfo } from '@/types/connection.types';

interface SettingsDevicesProps {
  connection: ConnectionInfo
}

export function SettingsDevices({ connection }: SettingsDevicesProps) {
  const settings = useSettingsDevices();
  const devices = settings.devices.data ?? [];
  const hydrated = useHydrated();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' });
  const hostname = new URL(connection.serverUrl).hostname;
  const isLoopback = hostname === 'localhost' || hostname === '[::1]' || hostname.startsWith('127.') || hostname.endsWith('.localhost');

  return (
    <SettingsPanel
      description={m.settings_devices_hint()}
      icon={IconLaptop}
      id="devices"
      title={m.settings_devices()}
    >
      {devices.map((device) => (
        <PanelRow key={device.id}>
          <IconLaptop />
          <PanelContent>
            <PanelTitle className="truncate">{device.name}</PanelTitle>
            <PanelDescription>
              {device.id === connection.deviceId ? m.settings_devices_current() : m.settings_devices_added({ date: hydrated ? date.format(new Date(device.createdAt)) : '' })}
            </PanelDescription>
          </PanelContent>
          {device.id === connection.deviceId ? null : (
            <Button
              asChild
              size="sm"
              variant="outline"
            >
              <Link
                params={{ deviceId: device.id }}
                resetScroll={false}
                to="/settings/devices/$deviceId/revoke"
              >
                {m.settings_devices_revoke()}
              </Link>
            </Button>
          )}
        </PanelRow>
      ))}
      <PanelRow className="items-start">
        <IconQrCode />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <PanelContent>
            <PanelTitle>{m.settings_devices_pair()}</PanelTitle>
            <PanelDescription>{m.settings_devices_pair_hint()}</PanelDescription>
          </PanelContent>
          {settings.pairing ? (
            <div className="flex flex-col items-start gap-2">
              <img
                alt={m.settings_devices_pair_qr()}
                className="size-48 rounded-lg bg-white p-2"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(settings.pairing.qr.svg)}`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void clipboardCopy(settings.pairing?.qr.payload ?? '')
                  .then(() => toasty(m.settings_devices_pair_copied(), '📋'))
                  .catch(() => toasty(m.ui_copy_failed(), '🔴'))}
              >
                <IconCopy />
                {m.settings_devices_pair_copy()}
              </Button>
            </div>
          ) : null}
          {isLoopback ? <PanelDescription>{m.settings_devices_pair_loopback()}</PanelDescription> : null}
          <FormErrors error={settings.pairProblem} />
          <ButtonLoading
            className="self-start"
            loading={settings.isPairing}
            size="sm"
            variant="outline"
            onClick={() => settings.pair(connection.serverUrl)}
          >
            {settings.pairing ? m.settings_devices_pair_again() : m.settings_devices_pair_create()}
          </ButtonLoading>
        </div>
      </PanelRow>
    </SettingsPanel>
  );
}
