import { useSettingsDeviceRevoke, useSettingsDevices } from '@repo/client/react';
import { useClipboardCopy } from '@repo/client/web';
import { m } from '@repo/i18n/client';
import { getLocale } from '@repo/i18n/runtime';
import { useHydrated } from '@tanstack/react-router';
import { Fragment, useState } from 'react';
import IconCopy from '~icons/lucide/copy';
import { Button } from '../button';
import { ButtonLoading } from '../button-loading';
import { FormErrors } from '../forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '../panel';
import { toasty } from '../sonner';
import { SettingsConfirm } from './settings-confirm';
import { SettingsGroup } from './settings-group';
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
  const [revoking, setRevoking] = useState<string | null>(null);
  const revoke = useSettingsDeviceRevoke({ onDone: () => setRevoking(null) });

  return (
    <SettingsGroup title={m.settings_devices()}>
      {devices.map((device) => (
        <Fragment key={device.id}>
          <PanelRow>
            <PanelContent>
              <PanelTitle className="truncate">{device.name}</PanelTitle>
              <PanelDescription>
                {device.id === connection.deviceId ? m.settings_devices_current() : m.settings_devices_added({ date: hydrated ? date.format(new Date(device.createdAt)) : '' })}
              </PanelDescription>
            </PanelContent>
            {device.id === connection.deviceId ? null : (
              <Button
                disabled={revoking === device.id}
                size="sm"
                variant="outline"
                onClick={() => {
                  revoke.reset();
                  setRevoking(device.id);
                }}
              >
                {m.settings_devices_revoke()}
              </Button>
            )}
          </PanelRow>
          {revoking === device.id ? (
            <SettingsConfirm
              confirmLabel={m.settings_devices_revoke()}
              description={m.settings_devices_revoke_description()}
              error={revoke.problem}
              pending={revoke.isPending}
              title={m.settings_devices_revoke_title({ name: device.name })}
              onCancel={() => setRevoking(null)}
              onConfirm={() => revoke.revoke(device.id)}
            />
          ) : null}
        </Fragment>
      ))}
      <PanelRow className="items-start">
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
    </SettingsGroup>
  );
}
