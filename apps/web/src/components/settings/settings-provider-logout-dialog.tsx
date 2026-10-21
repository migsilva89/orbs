import { m } from '@openbots/i18n/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import { rpc } from '@/services/rpc/rpc.client';
import type { Provider } from '@openbots/contracts/universal';

interface SettingsProviderLogoutDialogProps {
  provider: Provider
  onOpenChange: (open: boolean) => void
}

export function SettingsProviderLogoutDialog({ provider, onOpenChange }: SettingsProviderLogoutDialogProps) {
  const queryClient = useQueryClient();

  const logout = useMutation(rpc.providers.logout.mutationOptions({
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rpc.providers.list.key() });
      onOpenChange(false);
    },
  }));

  return (
    <ConfirmationDialog
      confirmLabel={m.settings_providers_sign_out()}
      error={logout.isError ? m.settings_providers_error() : null}
      pending={logout.isPending}
      title={m.settings_providers_sign_out_title({ provider: provider.name })}
      variant="destructive"
      onConfirm={() => logout.mutate({ providerId: provider.id })}
      onOpenChange={onOpenChange}
    >
      {m.settings_providers_sign_out_description({ provider: provider.name })}
    </ConfirmationDialog>
  );
}
