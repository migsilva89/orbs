import { ClientOnly, createFileRoute } from '@tanstack/react-router';
import { SettingsThemeDialog } from '@/components/settings/settings-theme-dialog';
import { useDialogNavigation } from '@/hooks/use-dialog-navigation';

export const Route = createFileRoute('/_chat/settings/themes/create')({
  component: SettingsThemeCreateRoute,
});

function SettingsThemeCreateRoute() {
  const { handleOpenChange, navigate } = useDialogNavigation({ to: '/settings' });
  return (
    <ClientOnly>
      <SettingsThemeDialog onOpenChange={handleOpenChange} onSaved={navigate} />
    </ClientOnly>
  );
}
