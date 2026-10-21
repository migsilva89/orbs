import { useSettingsDevices } from '@openbots/client/react';
import { getLocale, m } from '@openbots/i18n/client';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { Copy, Laptop, QrCode } from 'lucide-react-native';
import { View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import type { ConnectionSaved } from '@openbots/contracts/universal';

interface SettingsDevicesProps {
  connection: ConnectionSaved;
}

export function SettingsDevices({ connection }: SettingsDevicesProps) {
  const router = useRouter();
  const toast = useToast();
  const settings = useSettingsDevices();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' });

  return (
    <BotDetailsSection
      description={m.settings_devices_hint()}
      icon={Laptop}
      title={m.settings_devices()}
    >
      <ItemGroup>
        {(settings.devices.data ?? []).map((device) => (
          <Item key={device.id}>
            <ItemMedia className="mt-1 self-start">
              <Icon icon={Laptop} tone="muted" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{device.name}</ItemTitle>
              <ItemDescription>
                {device.id === connection.deviceId ? m.settings_devices_current() : m.settings_devices_added({ date: date.format(new Date(device.createdAt)) })}
              </ItemDescription>
            </ItemContent>
            {device.id === connection.deviceId ? null : (
              <Button
                size="sm"
                variant="outline"
                onPress={() => router.push({ pathname: '/settings/devices/[deviceId]/revoke', params: { deviceId: device.id } })}
              >
                {m.settings_devices_revoke()}
              </Button>
            )}
          </Item>
        ))}
      </ItemGroup>
      <View className="gap-3 rounded-lg border border-border bg-card p-3">
        <View className="flex-row items-center gap-2">
          <Icon icon={QrCode} tone="muted" />
          <ItemTitle>{m.settings_devices_pair()}</ItemTitle>
        </View>
        <LabelDescription>{m.settings_devices_pair_hint()}</LabelDescription>
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
    </BotDetailsSection>
  );
}
