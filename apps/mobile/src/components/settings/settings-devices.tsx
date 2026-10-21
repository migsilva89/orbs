import { useSettingsDevices } from '@openbots/client/react';
import { getLocale, m } from '@openbots/i18n/client';
import { useRouter } from 'expo-router';
import { Laptop } from 'lucide-react-native';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { SettingsDevicesPair } from './settings-devices-pair';
import type { ConnectionSaved } from '@openbots/contracts/universal';

interface SettingsDevicesProps {
  connection: ConnectionSaved;
}

export function SettingsDevices({ connection }: SettingsDevicesProps) {
  const router = useRouter();
  const settings = useSettingsDevices();
  const date = new Intl.DateTimeFormat(getLocale(), { dateStyle: 'medium' });

  return (
    <BotDetailsSection
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
      <SettingsDevicesPair connection={connection} />
    </BotDetailsSection>
  );
}
