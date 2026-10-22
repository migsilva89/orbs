import { m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { ScanQrCode } from 'lucide-react-native';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { useConnection } from '@/hooks/use-connection';
import { SettingsDevicesPair } from './settings-devices-pair';

export function SettingsDevicesPairScreen() {
  const router = useRouter();
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => (
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-4 px-4 pt-4 pb-12"
        contentInsetAdjustmentBehavior="automatic"
      >
        <SettingsDevicesPair isTitleHidden connection={current.connection} />
        <Card size="sm">
          <View className="flex-row items-center gap-2">
            <Icon icon={ScanQrCode} tone="muted" />
            <ItemTitle>{m.settings_devices_scan_title()}</ItemTitle>
          </View>
          <LabelDescription>{m.settings_devices_scan_description()}</LabelDescription>
          <Button
            size="sm"
            variant="outline"
            onPress={() => router.push('/settings/devices/scan')}
          >
            <Icon icon={ScanQrCode} size="sm" />
            {m.settings_devices_scan()}
          </Button>
        </Card>
      </ScrollView>
    ))
    .otherwise(() => null);
}
