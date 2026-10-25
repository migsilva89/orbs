import { useSettingsDevices } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import * as Clipboard from 'expo-clipboard';
import { Copy, QrCode, RefreshCw } from 'lucide-react-native';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Empty } from '@/components/ui/empty';
import { Icon } from '@/components/ui/icon';
import { ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/use-toast';

interface SettingsDevicesPairProps {
  isTitleHidden?: boolean;
}

export function SettingsDevicesPair({ isTitleHidden = false }: SettingsDevicesPairProps) {
  const toast = useToast();
  const settings = useSettingsDevices();

  return (
    <Card size="sm">
      {isTitleHidden ? null : (
        <View className="flex-row items-center gap-2">
          <Icon icon={QrCode} tone="muted" />
          <ItemTitle>{m.settings_devices_pair()}</ItemTitle>
        </View>
      )}
      {settings.pairing ? (
        <View className="items-center gap-3 py-2">
          <Text
            selectable
            accessibilityLabel={m.settings_devices_pair_pin()}
            variant="pin"
          >
            {settings.pairing.pin}
          </Text>
          <View accessibilityLabel={m.settings_devices_pair_qr()} className="rounded-xl bg-white p-3">
            <SvgXml
              height={208}
              width={208}
              xml={settings.pairing.qr.svg}
            />
          </View>
          <LabelDescription className="max-w-xs text-center">{m.settings_devices_pair_ready()}</LabelDescription>
          <View className="flex-row gap-2">
            <Button
              size="sm"
              variant="outline"
              onPress={() => void Clipboard.setStringAsync(settings.pairing?.qr.payload ?? '')
                .then(() => toast.show({ message: m.settings_devices_pair_copied(), variant: 'default' }))
                .catch(() => toast.show({ message: m.mobile_copy_failed(), variant: 'error' }))}
            >
              <Icon icon={Copy} size="sm" />
              {m.settings_devices_pair_copy()}
            </Button>
            <Button
              loading={settings.isPairing}
              size="sm"
              variant="ghost"
              onPress={settings.pair}
            >
              <Icon icon={RefreshCw} size="sm" />
              {m.settings_devices_pair_again()}
            </Button>
          </View>
        </View>
      ) : (
        <Empty
          action={(
            <Button
              loading={settings.isPairing}
              size="sm"
              onPress={settings.pair}
            >
              <Icon icon={QrCode} size="sm" />
              {m.settings_devices_pair_create()}
            </Button>
          )}
          description={m.settings_devices_pair_empty_description()}
          icon={(
            <Icon
              icon={QrCode}
              size="lg"
              tone="muted"
            />
          )}
          size="sm"
          title={m.settings_devices_pair_empty_title()}
        />
      )}
      {settings.pairProblem ? <LabelDescription accessibilityRole="alert" variant="error">{settings.pairProblem}</LabelDescription> : null}
    </Card>
  );
}
