import { useSettingsDeviceRevoke } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { ConfirmationDialog } from '../alert-dialog';
import type { Device } from '@repo/contracts/universal';

interface SettingsDeviceRevokeDialogProps {
  device: Device
  onOpenChange: (open: boolean) => void
}

export function SettingsDeviceRevokeDialog({ device, onOpenChange }: SettingsDeviceRevokeDialogProps) {
  const revoke = useSettingsDeviceRevoke({ onDone: () => onOpenChange(false) });

  return (
    <ConfirmationDialog
      confirmLabel={m.settings_devices_revoke()}
      error={revoke.problem}
      pending={revoke.isPending}
      title={m.settings_devices_revoke_title({ name: device.name })}
      variant="destructive"
      onConfirm={() => revoke.revoke(device.id)}
      onOpenChange={onOpenChange}
    >
      {m.settings_devices_revoke_description()}
    </ConfirmationDialog>
  );
}
