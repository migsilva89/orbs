import { useSettingsDeviceRevoke, useSettingsDevices } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface SettingsDeviceRevokeDialogProps {
  deviceId: string;
}

export function SettingsDeviceRevokeDialog({ deviceId }: SettingsDeviceRevokeDialogProps) {
  const router = useRouter();
  const { devices } = useSettingsDevices();
  const revoke = useSettingsDeviceRevoke({ onDone: () => router.back() });
  const name = devices.data?.find((device) => device.id === deviceId)?.name ?? '';

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.settings_devices_revoke()}
      description={m.settings_devices_revoke_description()}
      error={revoke.problem}
      isPending={revoke.isPending}
      title={m.settings_devices_revoke_title({ name })}
      onCancel={() => router.back()}
      onConfirm={() => revoke.revoke(deviceId)}
    />
  );
}
