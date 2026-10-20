import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { FormErrors } from '@/components/ui/forms/form';
import { rpc } from '@/services/rpc/rpc.client';
import type { Device } from '@openbots/contracts/universal';

interface SettingsDeviceRevokeDialogProps {
  device: Device
  onOpenChange: (open: boolean) => void
}

export function SettingsDeviceRevokeDialog({ device, onOpenChange }: SettingsDeviceRevokeDialogProps) {
  const queryClient = useQueryClient();

  const revoke = useMutation(rpc.devices.revoke.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.devices.list.key() });
      onOpenChange(false);
    },
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.settings_devices_revoke()}
      pending={revoke.isPending}
      title={m.settings_devices_revoke_title({ name: device.name })}
      variant="destructive"
      onConfirm={() => revoke.mutate({ id: device.id })}
      onOpenChange={onOpenChange}
    >
      {m.settings_devices_revoke_description()}
      <FormErrors error={revoke.isError ? m.settings_devices_revoke_error() : null} />
    </ConfirmationDialog>
  );
}
