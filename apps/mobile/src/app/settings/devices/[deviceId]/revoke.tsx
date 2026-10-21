import { useLocalSearchParams } from 'expo-router';
import { SettingsDeviceRevokeDialog } from '@/components/settings/settings-device-revoke-dialog';

export default function SettingsDeviceRevokeRoute() {
  const { deviceId } = useLocalSearchParams<{ deviceId: string }>();

  return <SettingsDeviceRevokeDialog deviceId={deviceId} />;
}
