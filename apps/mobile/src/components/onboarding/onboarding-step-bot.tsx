import { standardSchemaResolver } from '@hookform/resolvers/standard-schema';
import { BOT_PERMISSION_HINTS, BOT_PERMISSION_LABELS, botAvatarEmoji, botDefaultSettings } from '@repo/client/client';
import { useBotCreate } from '@repo/client/react';
import { botAvatar, botForm } from '@repo/contracts/universal';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Shield } from 'lucide-react-native';
import { useEffect } from 'react';
import { FormProvider, useController, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { BotSettingsModel } from '@/components/bots/bot-settings-model';
import { BotSettingsProfile } from '@/components/bots/bot-settings-profile';
import { OnboardingSceneBot } from '@/components/onboarding/onboarding-scene-bot';
import { OnboardingStepLayout } from '@/components/onboarding/onboarding-step-layout';
import { Button } from '@/components/ui/button';
import { ItemGroup } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { useConnection } from '@/hooks/use-connection';
import { botMenuPermissions } from '@/services/bot/bot-menu.utils';
import type { BotAvatarRouteParams } from '@/types/bot-avatar.types';
import type { RpcSession } from '@/types/rpc.types';

export function OnboardingStepBot() {
  const { session } = useConnection();

  return session ? <OnboardingStepBotForm session={session} /> : null;
}

interface OnboardingStepBotFormProps {
  session: RpcSession;
}

function OnboardingStepBotForm({ session }: OnboardingStepBotFormProps) {
  const router = useRouter();
  const { avatarEmoji } = useLocalSearchParams<BotAvatarRouteParams>();
  const { data: bots = [] } = useQuery(session.rpc.bots.list.queryOptions());
  const { data: tools } = useQuery(session.rpc.tools.settings.queryOptions());
  const { data: models } = useQuery({ ...session.rpc.models.list.queryOptions(), retry: false });
  const settings = botDefaultSettings({ models: models ?? [], thinkingLevel: 'medium' });
  const done = (handle?: string) => router.push({ pathname: '/onboarding/[step]', params: { step: 'done', handle } });

  const form = useForm({
    resolver: standardSchemaResolver(botForm),
    resetOptions: { keepDirtyValues: true },
    values: {
      avatar: null,
      fallbackModel: null,
      name: m.rooms_bot_default_name(),
      handle: '',
      instructions: '',
      ...settings,
      permission: tools?.isJevConfigured ? 'auto' : 'ask',
    },
  });

  useEffect(() => {
    if (!avatarEmoji) {
      return;
    }

    const next = botAvatar.safeParse(botAvatarEmoji({ avatar: form.getValues('avatar'), emoji: avatarEmoji }));

    if (next.success) {
      form.setValue('avatar', next.data, { shouldDirty: true });
    }

    router.setParams({ avatarEmoji: undefined });
  }, [avatarEmoji, form, router]);

  const permission = useController({ control: form.control, name: 'permission' });
  const create = useBotCreate({ onCreated: (bot) => done(bot.handle) });
  const value = permission.field.value ?? 'ask';

  return (
    <FormProvider {...form}>
      <OnboardingStepLayout
        hasBack
        description={bots.length > 0 ? m.onboarding_bot_description_existing() : m.onboarding_bot_description()}
        primary={(
          <Button
            className="w-full"
            disabled={create.isPending}
            loading={create.isPending}
            size="lg"
            onPress={() => void form.handleSubmit(create.create)()}
          >
            {m.rooms_bot_submit()}
          </Button>
        )}
        scene={<OnboardingSceneBot />}
        secondary={bots.length > 0 ? (
          <Button
            className="w-full"
            disabled={create.isPending}
            variant="ghost"
            onPress={() => done()}
          >
            {m.onboarding_skip()}
          </Button>
        ) : null}
        step="bot"
        title={m.onboarding_bot_title()}
      >
        <View className="gap-6">
          <BotSettingsProfile emojiRoute="/onboarding/emoji" isDisabled={create.isPending} />
          <BotSettingsModel isDisabled={create.isPending} session={session} />
          <ItemGroup>
            <BotSettingsMenuRow
              description={BOT_PERMISSION_HINTS[value]()}
              icon={Shield}
              isDisabled={create.isPending}
              items={botMenuPermissions({ permission: value, onSelect: permission.field.onChange })}
              title={m.rooms_bot_permission()}
              value={BOT_PERMISSION_LABELS[value]()}
            />
          </ItemGroup>
          {create.problem ? <LabelDescription accessibilityRole="alert" variant="error">{create.problem}</LabelDescription> : null}
        </View>
      </OnboardingStepLayout>
    </FormProvider>
  );
}
