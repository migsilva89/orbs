import { useSettingsDevices } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import * as Clipboard from 'expo-clipboard';
import { Copy, QrCode } from 'lucide-react-native';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionSaved } from '@openbots/contracts/universal';

interface SettingsDevicesPairProps {
  connection: ConnectionSaved;
  isTitleHidden?: boolean;
}

export function SettingsDevicesPair({ connection, isTitleHidden = false }: SettingsDevicesPairProps) {
  const toast = useToast();
  const settings = useSettingsDevices();

  return (
    <View className="gap-3 rounded-lg border border-border bg-card p-3">
      {isTitleHidden ? null : (
        <View className="flex-row items-center gap-2">
          <Icon icon={QrCode} tone="muted" />
          <ItemTitle>{m.settings_devices_pair()}</ItemTitle>
        </View>
      )}
      {settings.pairing ? (
        <View className="items-start gap-2">
          <View accessibilityLabel={m.settings_devices_pair_qr()} className="rounded-lg bg-white p-2">
            <SvgXml
              height={176}
              width={176}
              xml={settings.pairing.qr.svg}
            />
          </View>
          <Button
            size="sm"
            variant="ghost"
            onPress={() => void Clipboard.setStringAsync(settings.pairing?.qr.payload ?? '')
              .then(() => toast.show({ message: m.settings_devices_pair_copied(), variant: 'default' }))
              .catch(() => toast.show({ message: m.mobile_copy_failed(), variant: 'error' }))}
          >
            <Icon icon={Copy} size="sm" />
            {m.settings_devices_pair_copy()}
          </Button>
        </View>
      ) : null}
      {settings.pairProblem ? <LabelDescription accessibilityRole="alert" variant="error">{settings.pairProblem}</LabelDescription> : null}
      <Button
        loading={settings.isPairing}
        size="sm"
        variant="outline"
        onPress={() => settings.pair(connection.serverUrl)}
      >
        {settings.pairing ? m.settings_devices_pair_again() : m.settings_devices_pair_create()}
      </Button>
    </View>
  );
}
