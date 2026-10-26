import { BOT_PERMISSION_LABELS, botModelBrand } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { useFormContext, useWatch } from 'react-hook-form';
import { View } from 'react-native';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { Avatar } from '@/components/ui/avatar';
import { Text } from '@/components/ui/text';
import type { BotForm } from '@repo/contracts/universal';

export function OnboardingSceneBot() {
  const form = useFormContext<BotForm>();
  const [avatar, name, modelProvider, modelId, permission] = useWatch({ control: form.control, name: ['avatar', 'name', 'modelProvider', 'modelId', 'permission'] });
  const botName = name.trim() || m.rooms_bot_default_name();

  return (
    <OnboardingScene>
      <View className="w-full max-w-80 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
        <View className="flex-row items-center gap-2.5 border-b border-border px-3 py-2.5">
          <Avatar
            animate
            avatar={avatar ?? null}
            name={botName}
            size="sm"
          />
          <View className="flex-1">
            <Text numberOfLines={1} variant="small">{botName}</Text>
            <View className="flex-row items-center gap-1">
              {modelId ? <BotBrandLogo brand={botModelBrand({ providerId: modelProvider, modelId })} size={11} /> : null}
              <Text
                numberOfLines={1}
                tone="muted"
                variant="caption"
              >{modelId || m.rooms_bot_model()}</Text>
            </View>
          </View>
          <View className="rounded-full border border-border px-2 py-0.5">
            <Text tone="muted" variant="caption">{BOT_PERMISSION_LABELS[permission]()}</Text>
          </View>
        </View>
        <View className="gap-2.5 p-3">
          <View className="self-end rounded-2xl bg-primary px-3 py-1.5">
            <Text tone="on-primary" variant="small">{m.onboarding_scene_bot_question()}</Text>
          </View>
          <View className="flex-row items-end gap-2">
            <Avatar
              avatar={avatar ?? null}
              name={botName}
              size="sm"
            />
            <View className="shrink rounded-2xl bg-muted px-3 py-1.5">
              <Text variant="small">{m.onboarding_scene_bot_answer({ name: botName })}</Text>
            </View>
          </View>
        </View>
      </View>
    </OnboardingScene>
  );
}
