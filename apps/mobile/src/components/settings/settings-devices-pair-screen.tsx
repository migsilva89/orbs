import { ScrollView } from 'react-native';
import { match, P } from 'ts-pattern';
import { useConnection } from '@/hooks/use-connection';
import { SettingsDevicesPair } from './settings-devices-pair';

export function SettingsDevicesPairScreen() {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="px-4 pt-4 pb-12"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SettingsDevicesPair isTitleHidden connection={current.connection} />
      </ScrollView>
    ))
    .otherwise(() => null);
}
