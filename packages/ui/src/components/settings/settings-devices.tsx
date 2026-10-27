import { useSettingsDevices } from '@repo/client/react';
import { useClipboardCopy } from '@repo/client/web';
import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { Link, useHydrated } from '@tanstack/react-router';
import IconCopy from '~icons/lucide/copy';
import IconLaptop from '~icons/lucide/laptop';
import IconQrCode from '~icons/lucide/qr-code';
import { Button } from '../button';
import { ButtonLoading } from '../button-loading';
import { FormErrors } from '../forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '../panel';
import { toasty } from '../sonner';
import { SettingsPanel } from './settings-panel';
import type { ConnectionInfo } from '@repo/client/client';

interface SettingsDevicesProps {
  connection: ConnectionInfo
}

export function SettingsDevices({ connection }: SettingsDevicesProps) {
  const settings = useSettingsDevices();
  const clipboard = useClipboardCopy();
  const devices = settings.devices.data ?? [];
  const hydrated = useHydrated();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' });

  return (
    <SettingsPanel
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
          </PanelContent>
          {settings.pairing ? (
            <div className="flex flex-col items-start gap-2">
              <p aria-label={m.settings_devices_pair_pin()} className="font-mono text-3xl tracking-widest">{settings.pairing.pin}</p>
              <p className="text-sm text-muted-foreground">{m.settings_devices_pair_ready()}</p>
              <img
                alt={m.settings_devices_pair_qr()}
                className="size-48 rounded-lg bg-white p-2"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(settings.pairing.qr.svg)}`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void clipboard.copy(settings.pairing?.qr.payload ?? '')
                  .then(() => toasty(m.settings_devices_pair_copied(), '📋'))
                  .catch(() => toasty(m.ui_copy_failed(), '🔴'))}
              >
                <IconCopy />
                {m.settings_devices_pair_copy()}
              </Button>
            </div>
          ) : null}
          <FormErrors error={settings.pairProblem} />
          <ButtonLoading
            className="self-start"
            loading={settings.isPairing}
            size="sm"
            variant="outline"
            onClick={settings.pair}
          >
            {settings.pairing ? m.settings_devices_pair_again() : m.settings_devices_pair_create()}
          </ButtonLoading>
        </div>
      </PanelRow>
    </SettingsPanel>
  );
}
