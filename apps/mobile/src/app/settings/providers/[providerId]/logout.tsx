import { useLocalSearchParams } from 'expo-router';
import { SettingsProviderLogoutDialog } from '@/components/settings/settings-provider-logout-dialog';

export default function SettingsProviderLogoutRoute() {
  const { providerId } = useLocalSearchParams<{ providerId: string }>();

  return <SettingsProviderLogoutDialog providerId={providerId} />;
}
