import { botDefaultSettings } from '@repo/client/client';
import { useRpc } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Check, Ellipsis } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { OnboardingScene } from '@/components/onboarding/onboarding-scene';
import { SettingsProviderLogo } from '@/components/settings/settings-provider-logo';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/cn';
import type { Provider } from '@repo/contracts/universal';

interface OnboardingSceneModelProps {
  connected: Provider[];
  featured: Provider[];
}

export function OnboardingSceneModel({ connected, featured }: OnboardingSceneModelProps) {
  const { rpc } = useRpc();
  const { data: models = [] } = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const extra = connected.find((provider) => !featured.includes(provider)) ?? null;
  const tiles = [...featured, extra];
  const active = tiles.find((provider) => provider?.isConfigured) ?? null;
  const offered = models.filter((model) => model.provider === active?.id);
  const { modelId } = botDefaultSettings({ models: offered, thinkingLevel: 'medium' });
  const modelName = offered.find((model) => model.id === modelId)?.name ?? active?.name;

  return (
    <OnboardingScene>
      <View className="w-full max-w-72 items-center">
        <View className="flex-row gap-6">
          {tiles.map((provider, index) => (
            <View className="items-center gap-1.5" key={provider?.id ?? index}>
              <View
                className={cn(
                  'size-13 items-center justify-center rounded-2xl border border-border bg-background shadow-sm',
                  provider !== null && provider === active && 'border-foreground/50',
                )}
              >
                {provider ? <SettingsProviderLogo providerId={provider.id} /> : <Icon icon={Ellipsis} tone="muted" />}
              </View>
              <Text tone="muted" variant="caption">{provider?.name ?? m.onboarding_scene_model_more()}</Text>
            </View>
          ))}
        </View>
        <View className="h-4 w-px bg-border" />
        <View className="w-full rounded-2xl border border-border bg-background px-4 py-3 shadow-sm">
          <View className="flex-row items-center gap-2.5">
            <Avatar
              animate
              avatar={{
                kind: 'blob',
                body: 'pebble',
                color: 'violet',
                expression: active ? 'happy' : 'curious',
              }}
              name=""
              size="sm"
            />
            <Text className="flex-1" variant="small">{m.onboarding_scene_model_bot()}</Text>
            {active ? (
              <Animated.View
                className="flex-row items-center gap-1 rounded-full bg-success/15 px-2 py-0.5"
                entering={ZoomIn.delay(900)}
                key={active.id}
              >
                <Icon
                  icon={Check}
                  size="sm"
                  tone="success"
                />
                <Text tone="success" variant="caption">{m.settings_providers_connected()}</Text>
              </Animated.View>
            ) : null}
          </View>
          <View className="mt-2.5 flex-row items-center gap-2 border-t border-border pt-2.5">
            <Text tone="muted" variant="caption">{m.onboarding_scene_model_thinks()}</Text>
            {active ? (
              <Animated.View
                className="ml-auto flex-row items-center gap-1.5"
                entering={FadeInDown.delay(400)}
                key={active.id}
              >
                <SettingsProviderLogo providerId={active.id} />
                <Text numberOfLines={1} variant="caption">{modelName}</Text>
              </Animated.View>
            ) : <Animated.View className="ml-auto h-2 w-24 rounded-full bg-muted" entering={FadeIn} />}
          </View>
        </View>
      </View>
    </OnboardingScene>
  );
}
