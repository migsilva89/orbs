import { BOT_THINKING_LEVEL_LABELS, botChooseModel, botModelKey, botModelUsage } from '@repo/client/client';
import { useRpc, useSettingsModelSwap } from '@repo/client/react';
import { m } from '@repo/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import { Brain, LifeBuoy, Sparkles } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, Switch } from 'react-native';
import { useCSSVariable } from 'uniwind';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { BotSettingsMenuRow } from '@/components/bots/bot-settings-menu-row';
import { Avatar } from '@/components/ui/avatar';
import { Icon } from '@/components/ui/icon';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { useToast } from '@/hooks/use-toast';
import type { SettingsModelSwapSource } from '@/types/settings.types';
import type { ModelSelection } from '@repo/contracts/universal';

interface SettingsModelSwapScreenProps {
  from: SettingsModelSwapSource;
}

export function SettingsModelSwapScreen({ from }: SettingsModelSwapScreenProps) {
  const router = useRouter();
  const toast = useToast();
  const { rpc } = useRpc();
  const [primary, primaryForeground] = useCSSVariable(['--color-primary', '--color-primary-foreground']).map(String);
  const bots = useQuery(rpc.bots.list.queryOptions());
  const catalog = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const providers = useQuery({ ...rpc.providers.list.queryOptions(), retry: false });
  const [target, setTarget] = useState<ModelSelection | null>(null);
  const [includeFallbacks, setIncludeFallbacks] = useState(false);
  const usage = botModelUsage({ bots: bots.data ?? [] }).get(botModelKey(from));
  const models = catalog.data ?? [];
  const targetModel = models.find((model) => model.provider === target?.modelProvider && model.id === target.modelId);
  const affected = [...new Map([...(usage?.primary ?? []), ...(includeFallbacks ? usage?.fallbacks ?? [] : [])].map((bot) => [bot.id, bot])).values()];

  const swap = useSettingsModelSwap({
    onDone: (message) => {
      toast.show({ message: message ?? m.settings_saved(), variant: 'default' });
      router.back();
    },
  });

  return (
    <>
      <Stack.Toolbar placement="right">
        <Stack.Toolbar.Button
          disabled={!target || affected.length === 0 || swap.isPending}
          style={{ color: primaryForeground }}
          tintColor={primary}
          variant="done"
          onPress={() => target && swap.swap({
            from,
            to: target,
            includeFallbacks,
            botIds: affected.map((bot) => bot.id),
          })}
        >
          {m.settings_models_apply({ count: affected.length })}
        </Stack.Toolbar.Button>
      </Stack.Toolbar>
      <ScrollView
        className="flex-1 bg-background"
        contentContainerClassName="gap-6 px-4 pt-4 pb-12"
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text tone="muted" variant="small">{m.settings_models_replace_hint()}</Text>
        <BotDetailsSection icon={Sparkles} title={m.settings_models_target()}>
          <ItemGroup>
            <BotSettingsMenuRow
              icon={Sparkles}
              isDisabled={catalog.isPending || swap.isPending}
              items={[...new Set(models.map((model) => model.provider))].map((providerId) => ({
                label: providers.data?.providers.find((provider) => provider.id === providerId)?.name ?? providerId,
                items: models.filter((model) => model.provider === providerId).map((model) => ({
                  label: model.name,
                  systemImage: model === targetModel ? 'checkmark' : undefined,
                  onSelect: () => setTarget(botChooseModel({ model, thinkingLevel: target?.thinkingLevel ?? 'medium' })),
                })),
              }))}
              title={m.rooms_bot_model()}
              value={targetModel?.name ?? '…'}
            />
            <BotSettingsMenuRow
              icon={Brain}
              isDisabled={!target || swap.isPending}
              items={(targetModel?.thinkingLevels ?? []).map((level) => ({
                label: BOT_THINKING_LEVEL_LABELS[level](),
                systemImage: level === target?.thinkingLevel ? 'checkmark' : undefined,
                onSelect: () => target && setTarget({ ...target, thinkingLevel: level }),
              }))}
              title={m.rooms_bot_thinking_level()}
              value={target ? BOT_THINKING_LEVEL_LABELS[target.thinkingLevel]() : '…'}
            />
            <Item>
              <ItemMedia>
                <Icon icon={LifeBuoy} tone="muted" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{m.settings_models_include_fallbacks()}</ItemTitle>
              </ItemContent>
              <Switch
                accessibilityLabel={m.settings_models_include_fallbacks()}
                disabled={swap.isPending || (usage?.fallbacks.length ?? 0) === 0}
                value={includeFallbacks}
                onValueChange={setIncludeFallbacks}
              />
            </Item>
          </ItemGroup>
        </BotDetailsSection>
        <BotDetailsSection title={m.settings_models_affected({ count: affected.length })}>
          <ItemGroup>
            {affected.map((bot) => {
              const isPrimary = usage?.primary.some((item) => item.id === bot.id) ?? false;
              const isFallback = includeFallbacks && (usage?.fallbacks.some((item) => item.id === bot.id) ?? false);
              const scope = isPrimary ? m.settings_models_primary() : m.settings_models_fallback();

              return (
                <Item key={bot.id} size="sm">
                  <ItemMedia>
                    <Avatar
                      avatar={bot.avatar}
                      name={bot.name}
                      size="xs"
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>{bot.name}</ItemTitle>
                    <ItemDescription>{isPrimary && isFallback ? m.settings_models_both() : scope}</ItemDescription>
                  </ItemContent>
                </Item>
              );
            })}
          </ItemGroup>
        </BotDetailsSection>
        {swap.problem ? <LabelDescription accessibilityRole="alert" variant="error">{swap.problem}</LabelDescription> : null}
      </ScrollView>
    </>
  );
}
