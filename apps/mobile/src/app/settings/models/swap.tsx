import { useLocalSearchParams } from 'expo-router';
import { SettingsModelSwapScreen } from '@/components/settings/settings-model-swap-screen';
import type { SettingsModelSwapSource } from '@/types/settings.types';

export default function SettingsModelSwapRoute() {
  const from = useLocalSearchParams<SettingsModelSwapSource>();

  return <SettingsModelSwapScreen from={{ modelProvider: from.modelProvider, modelId: from.modelId }} />;
}
