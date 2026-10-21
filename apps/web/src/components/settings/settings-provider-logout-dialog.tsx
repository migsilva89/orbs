import { useSettingsProviderLogout } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { ConfirmationDialog } from '@/components/ui/alert-dialog';
import type { Provider } from '@openbots/contracts/universal';

interface SettingsProviderLogoutDialogProps {
  provider: Provider
  onOpenChange: (open: boolean) => void
}

export function SettingsProviderLogoutDialog({ provider, onOpenChange }: SettingsProviderLogoutDialogProps) {
  const logout = useSettingsProviderLogout({ onDone: () => onOpenChange(false) });

  return (
    <ConfirmationDialog
      confirmLabel={m.settings_providers_sign_out()}
      error={logout.problem}
      pending={logout.isPending}
      title={m.settings_providers_sign_out_title({ provider: provider.name })}
      variant="destructive"
      onConfirm={() => logout.logout(provider.id)}
      onOpenChange={onOpenChange}
    >
      {m.settings_providers_sign_out_description({ provider: provider.name })}
    </ConfirmationDialog>
  );
}
