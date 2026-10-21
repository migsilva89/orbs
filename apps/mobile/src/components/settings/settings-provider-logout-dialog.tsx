import { useSettingsProviderLogout, useSettingsProviders } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface SettingsProviderLogoutDialogProps {
  providerId: string;
}

export function SettingsProviderLogoutDialog({ providerId }: SettingsProviderLogoutDialogProps) {
  const router = useRouter();
  const providers = useSettingsProviders();
  const logout = useSettingsProviderLogout({ onDone: () => router.back() });
  const name = providers.connected.find((provider) => provider.id === providerId)?.name ?? providerId;

  return (
    <ConfirmDialog
      isDestructive
      confirmLabel={m.settings_providers_sign_out()}
      description={m.settings_providers_sign_out_description({ provider: name })}
      error={logout.problem}
      isPending={logout.isPending}
      title={m.settings_providers_sign_out_title({ provider: name })}
      onCancel={() => router.back()}
      onConfirm={() => logout.logout(providerId)}
    />
  );
}
