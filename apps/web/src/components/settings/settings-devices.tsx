import { m } from '@openbots/i18n/client';
import { getLocale } from '@openbots/i18n/runtime';
import { useMutation, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { SettingsPanel } from '@/components/settings/settings-panel';
import { Button } from '@/components/ui/button';
import { ButtonLoading } from '@/components/ui/button-loading';
import { FormErrors } from '@/components/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@/components/ui/panel';
import { toasty } from '@/components/ui/sonner';
import { clipboardCopy } from '@/lib/clipboard';
import { connectionRead } from '@/services/connection/connection.client';
import { rpc } from '@/services/rpc/rpc.client';
import IconCopy from '~icons/lucide/copy';
import IconLaptop from '~icons/lucide/laptop';
import IconQrCode from '~icons/lucide/qr-code';

export function SettingsDevices() {
  const queryClient = useQueryClient();
  const { data: devices } = useSuspenseQuery(rpc.devices.list.queryOptions());
  const current = connectionRead();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' });
  const pair = useMutation(rpc.pairing.create.mutationOptions());
  const hostname = current ? new URL(current.serverUrl).hostname : '';
  const isLoopback = hostname === 'localhost' || hostname === '[::1]' || hostname.startsWith('127.') || hostname.endsWith('.localhost');
  const revoke = useMutation(rpc.devices.revoke.mutationOptions({ onSuccess: () => queryClient.invalidateQueries({ queryKey: rpc.devices.list.key() }) }));

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
              {device.id === current?.deviceId ? m.settings_devices_current() : m.settings_devices_added({ date: date.format(new Date(device.createdAt)) })}
            </PanelDescription>
          </PanelContent>
          {device.id === current?.deviceId ? null : (
            <Button
              disabled={revoke.isPending}
              size="sm"
              variant="outline"
              onClick={() => revoke.mutate({ id: device.id })}
            >
              {m.settings_devices_revoke()}
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
          {pair.data ? (
            <div className="flex flex-col items-start gap-2">
              <img
                alt={m.settings_devices_pair_qr()}
                className="size-48 rounded-lg bg-white p-2"
                src={`data:image/svg+xml;utf8,${encodeURIComponent(pair.data.qr.svg)}`}
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={() => void clipboardCopy(pair.data.qr.payload)
                  .then(() => toasty(m.settings_devices_pair_copied(), '📋'))
                  .catch(() => toasty(m.ui_copy_failed(), '🔴'))}
              >
                <IconCopy />
                {m.settings_devices_pair_copy()}
              </Button>
            </div>
          ) : null}
          {isLoopback ? <PanelDescription>{m.settings_devices_pair_loopback()}</PanelDescription> : null}
          <FormErrors error={pair.isError ? m.settings_devices_pair_error() : null} />
          <ButtonLoading
            className="self-start"
            disabled={!current}
            loading={pair.isPending}
            size="sm"
            variant="outline"
            onClick={() => current && pair.mutate({ serverUrl: current.serverUrl })}
          >
            {pair.data ? m.settings_devices_pair_again() : m.settings_devices_pair_create()}
          </ButtonLoading>
        </div>
      </PanelRow>
      <FormErrors error={revoke.isError ? m.settings_devices_revoke_error() : null} />
    </SettingsPanel>
  );
}
