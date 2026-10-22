import { m } from '@repo/i18n/client';
import { useMutation } from '@tanstack/react-query';
import { useRpc } from './use-rpc';
import type { SettingsDoneParams } from '../types/settings.types';

/** Revokes a paired device's access. */
export function useSettingsDeviceRevoke({ onDone }: SettingsDoneParams) {
  const { rpc } = useRpc();
  const revoke = useMutation(rpc.devices.revoke.mutationOptions({ meta: { invalidates: [rpc.devices.list.key()] }, onSuccess: () => onDone() }));

  return {
    isPending: revoke.isPending,
    problem: revoke.isError ? m.settings_devices_revoke_error() : null,
    revoke: (id: string) => revoke.mutate({ id }),
  };
}
