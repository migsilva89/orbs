import { ScrollView } from 'react-native';
import { match, P } from 'ts-pattern';
import { useConnection } from '@/hooks/use-connection';
import { SettingsDevices } from './settings-devices';
import { SettingsGeneral } from './settings-general';
import { SettingsModels } from './settings-models';
import { SettingsProviders } from './settings-providers';
import { SettingsSecrets } from './settings-secrets';
import { SettingsSources } from './settings-sources';
import { SettingsTools } from './settings-tools';

export function SettingsScreen() {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <ScrollView
        automaticallyAdjustKeyboardInsets
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pt-4 pb-12"
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        <SettingsGeneral />
        <SettingsProviders />
        <SettingsModels />
        <SettingsTools />
        <SettingsSecrets />
        <SettingsSources />
        <SettingsDevices connection={current.connection} />
      </ScrollView>
    ))
    .otherwise(() => null);
}
