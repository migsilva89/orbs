import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { botDefaultSettings } from '@repo/client/client';
import { useBotCreate } from '@repo/client/react';
import { botForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { FormProvider, useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { match, P } from 'ts-pattern';
import { useCSSVariable } from 'uniwind';
import { BotSettingsModel } from '@/components/bots/bot-settings-model';
import { BotSettingsProfile } from '@/components/bots/bot-settings-profile';
import { Text } from '@/components/ui/text';
import { useConnection } from '@/hooks/use-connection';
import type { RpcSession } from '@/types/rpc.types';
import type { BotSettings } from '@repo/client/client';

export function BotCreateScreen() {
  const { session } = useConnection();

  return match(session)
    .with(P.nonNullable, (current) => <BotCreateScreenLoader session={current} />)
    .otherwise(() => null);
}

interface BotCreateScreenLoaderProps {
  session: RpcSession;
}

function BotCreateScreenLoader({ session }: BotCreateScreenLoaderProps) {
  const models = useQuery({ ...session.rpc.models.list.queryOptions(), retry: false });

  return match(models)
    .with({ isPending: true }, () => (
      <View accessibilityLabel={m.mobile_chat_loading()} className="flex-1 items-center justify-center bg-background">
        <Text tone="muted">{m.mobile_chat_loading()}</Text>
      </View>
    ))
    .otherwise(() => (
      <BotCreateScreenForm
        session={session}
        settings={models.data ? botDefaultSettings({ models: models.data, thinkingLevel: 'medium' }) : null}
      />
    ));
}

interface BotCreateScreenFormProps {
  session: RpcSession;
  settings: BotSettings | null;
}

function BotCreateScreenForm({ session, settings }: BotCreateScreenFormProps) {
  const router = useRouter();
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);

  const form = useForm({
    resolver: standardSchemaResolver(botForm),
    defaultValues: {
      avatar: null,
      fallbackModel: null,
      name: m.rooms_bot_default_name(),
      handle: '',
      instructions: '',
      modelProvider: settings?.modelProvider ?? '',
      modelId: settings?.modelId ?? '',
      thinkingLevel: settings?.thinkingLevel ?? 'medium',
    },
  });

  const create = useBotCreate({ onCreated: (bot) => router.replace({ pathname: '/chat/[botId]', params: { botId: bot.id } }) });

  return (
    <FormProvider {...form}>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={create.isPending}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={() => void form.handleSubmit(create.create)()}
        >
          {m.rooms_bot_submit()}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <View className="flex-1 bg-background">
        <ScrollView
          automaticallyAdjustKeyboardInsets
          contentContainerClassName="gap-6 px-4 pt-4 pb-12"
          contentInsetAdjustmentBehavior="automatic"
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <Text tone="muted" variant="small">{m.rooms_bot_description()}</Text>
          <BotSettingsProfile isDisabled={create.isPending} />
          <BotSettingsModel isDisabled={create.isPending} session={session} />
          {create.problem ? <Text tone="destructive" variant="small">{create.problem}</Text> : null}
        </ScrollView>
      </View>
    </FormProvider>
  );
}
