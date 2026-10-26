import { BOT_PERMISSION_LABELS, botModelBrand } from '@repo/client/client';
import { useRpc } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Check, Cpu, Laptop, ShieldCheck } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Bot } from '@repo/contracts/universal';
import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';

const ROW_DELAYS = [550, 800, 1050];

interface OnboardingSceneDoneProps {
  bot?: Bot;
}

export function OnboardingSceneDone({ bot }: OnboardingSceneDoneProps) {
  const { rpc } = useRpc();
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const model = bot ? models.find((item) => item.provider === bot.modelProvider && item.id === bot.modelId) : undefined;

  const rows: { icon: LucideIcon, label: string, value: ReactNode }[] = bot
    ? [
      {
        icon: Cpu,
        label: m.onboarding_scene_done_model(),
        value: (
          <>
            <BotBrandLogo brand={botModelBrand({ providerId: bot.modelProvider, modelId: bot.modelId })} size={12} />
            <Text numberOfLines={1} variant="caption">{model?.name ?? bot.modelId}</Text>
          </>
        ),
      },
      { icon: ShieldCheck, label: m.onboarding_scene_done_permission(), value: <Text variant="caption">{BOT_PERMISSION_LABELS[bot.permission]()}</Text> },
      { icon: Laptop, label: m.onboarding_scene_done_host(), value: <Text variant="caption">{m.onboarding_scene_done_host_value()}</Text> },
    ]
    : [];

  return (
    <OnboardingScene>
      <Animated.View className="w-full max-w-72 rounded-2xl border border-border bg-background p-3.5 shadow-sm" entering={FadeInDown.duration(450)}>
        <View className="flex-row items-center gap-2.5">
          <Avatar
            animate
            avatar={bot ? bot.avatar : {
              kind: 'blob',
              body: 'pebble',
              color: 'violet',
              expression: 'happy',
            }}
            name={bot?.name ?? m.onboarding_scene_model_bot()}
          />
          <View className="flex-1">
            <Text numberOfLines={1} variant="small">{bot?.name ?? m.onboarding_scene_model_bot()}</Text>
            {bot ? <Text tone="muted" variant="caption">{`@${bot.handle}`}</Text> : null}
          </View>
          <Animated.View className="flex-row items-center gap-1 rounded-full bg-success/15 px-2 py-0.5" entering={ZoomIn.delay(1450).springify()}>
            <Icon
              icon={Check}
              size="sm"
              tone="success"
            />
            <Text tone="success" variant="caption">{m.onboarding_scene_done_ready()}</Text>
          </Animated.View>
        </View>
        {rows.length > 0 ? (
          <View className="mt-3 gap-2 border-t border-border pt-3">
            {rows.map((row, index) => (
              <View className="flex-row items-center gap-2" key={row.label}>
                <Icon
                  icon={row.icon}
                  size="sm"
                  tone="muted"
                />
                <Text tone="muted" variant="caption">{row.label}</Text>
                <Animated.View className="ml-auto shrink flex-row items-center gap-1.5" entering={FadeInRight.delay(ROW_DELAYS[index])}>
                  {row.value}
                </Animated.View>
                <Animated.View className="size-4 items-center justify-center rounded-full bg-success" entering={ZoomIn.delay(ROW_DELAYS[index] + 100)}>
                  <Icon
                    icon={Check}
                    size="xs"
                    tone="on-primary"
                  />
                </Animated.View>
              </View>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </OnboardingScene>
  );
}
