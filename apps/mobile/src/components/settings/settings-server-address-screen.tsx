import { useSettingsServer } from '@repo/client/react';
import { serverOrigin } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { match, P } from 'ts-pattern';
import { useCSSVariable } from 'uniwind';
import { FormInput } from '@/components/ui/form-input';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import { useServerReachable } from '@/hooks/use-server-reachable';
import { connectionAddressesSave } from '@/services/connection/connection.client';
import type { RpcSession } from '@/types/rpc.types';

export function SettingsServerAddressScreen() {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <SettingsServerAddressScreenForm session={current} />)
    .otherwise(() => null);
}

interface SettingsServerAddressScreenFormProps {
  session: RpcSession;
}

function SettingsServerAddressScreenForm({ session }: SettingsServerAddressScreenFormProps) {
  const router = useRouter();
  const settings = useSettingsServer();
  const isReachable = useServerReachable(session);
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);
  const [url, setUrl] = useState('');
  const parsed = serverOrigin.safeParse(url.trim());

  const save = async () => {
    if (!parsed.success) {
      return;
    }

    await connectionAddressesSave({
      connection: session.connection,
      addresses: [{ url: parsed.data, kind: 'custom' }, ...session.connection.addresses.filter((address) => address.url !== parsed.data)],
    });

    if (isReachable) {
      settings.add(parsed.data);
    }

    void session.queryClient.refetchQueries();
    router.back();
  };

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={!parsed.success}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={() => void save()}
        >
          {m.mobile_address_save()}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pt-4 pb-12"
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        <Text tone="muted" variant="small">{m.mobile_address_description()}</Text>
        <FormInput
          required
          autoCapitalize="none"
          autoCorrect={false}
          error={url.trim() && !parsed.success ? m.mobile_address_invalid() : null}
          keyboardType="url"
          label={m.mobile_address_label()}
          placeholder={m.settings_server_add_placeholder()}
          value={url}
          onChangeText={setUrl}
        />
      </ScrollView>
    </>
  );
}
