import { connectionAddressesMerge } from '@repo/client/client';
import { useSettingsServer } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useRouter } from 'expo-router';
import { Plus, Server } from 'lucide-react-native';
import { match } from 'ts-pattern';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/ui/item';
import { StatusDot } from '@/components/ui/status-dot';
import { Text } from '@/components/ui/text';
import { connectionAddressesSave } from '@/services/connection/connection.client';
import type { RpcSession } from '@/types/rpc.types';
import type { ServerAddressKind } from '@repo/contracts/universal';

interface SettingsServerProps {
  session: RpcSession;
}

export function SettingsServer({ session }: SettingsServerProps) {
  const router = useRouter();

  const kindLabel = (kind: ServerAddressKind) => match(kind)
    .with('loopback', () => m.settings_server_kind_loopback())
    .with('lan', () => m.settings_server_kind_lan())
    .with('tailscale', () => m.settings_server_kind_tailscale())
    .with('custom', () => m.settings_server_kind_custom())
    .exhaustive();

  const settings = useSettingsServer();
  const active = session.address().url;
  const addresses = connectionAddressesMerge(session.connection.addresses, settings.addresses);

  const remove = async (url: string) => {
    if (settings.addresses.some((address) => address.url === url)) {
      settings.remove(url);
    }

    await connectionAddressesSave({
      connection: session.connection,
      addresses: session.connection.addresses.filter((address) => address.url !== url),
    });

    void session.queryClient.invalidateQueries({ queryKey: session.rpc.server.info.key() });
  };

  return (
    <BotDetailsSection
      icon={Server}
      title={m.settings_server()}
    >
      <Text tone="muted" variant="small">{m.settings_server_description()}</Text>
      <ItemGroup>
        {addresses.map((address) => (
          <Item key={address.url}>
            <ItemContent>
              <ItemTitle numberOfLines={1}>{address.url}</ItemTitle>
              <ItemDescription>{kindLabel(address.kind)}</ItemDescription>
            </ItemContent>
            {address.url === active ? <StatusDot label={m.settings_server_active()} variant="success" /> : null}
            {address.kind === 'custom' ? (
              <Button
                loading={settings.isSaving}
                size="sm"
                variant="outline"
                onPress={() => void remove(address.url)}
              >
                {m.settings_server_remove()}
              </Button>
            ) : null}
          </Item>
        ))}
      </ItemGroup>
      {settings.problem ? <Text tone="destructive" variant="small">{settings.problem}</Text> : null}
      <Button
        size="sm"
        variant="outline"
        onPress={() => router.push('/settings/server/address')}
      >
        <Icon icon={Plus} size="sm" />
        {m.settings_server_add()}
      </Button>
    </BotDetailsSection>
  );
}
