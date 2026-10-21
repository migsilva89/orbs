import { botModelBrand, botModelUsage } from '@openbots/client/client';
import { useRpc } from '@openbots/client/react';
import { m } from '@openbots/i18n/client';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Cpu } from 'lucide-react-native';
import { BotBrandLogo } from '@/components/bots/bot-brand-logo';
import { BotDetailsSection } from '@/components/bots/bot-details-section';
import { Button } from '@/components/ui/button';
import { Item, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from '@/components/ui/item';
import { LabelDescription } from '@/components/ui/label';

export function SettingsModels() {
  const router = useRouter();
  const { rpc } = useRpc();
  const bots = useQuery(rpc.bots.list.queryOptions());
  const catalog = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const providers = useQuery({ ...rpc.providers.list.queryOptions(), retry: false });
  const models = botModelUsage({ bots: bots.data ?? [] });

  return (
    <BotDetailsSection
      icon={Cpu}
      title={m.settings_models_title()}
    >
      {bots.isError ? <LabelDescription accessibilityRole="alert" variant="error">{m.settings_models_load_error()}</LabelDescription> : null}
      {bots.isSuccess && models.size === 0 ? <LabelDescription>{m.settings_models_empty()}</LabelDescription> : null}
      <ItemGroup>
        {[...models].map(([key, usage]) => {
          const provider = providers.data?.providers.find((item) => item.id === usage.model.modelProvider);
          const model = catalog.data?.find((item) => item.provider === usage.model.modelProvider && item.id === usage.model.modelId);

          return (
            <Item key={key}>
              <ItemMedia className="mt-1 self-start">
                <BotBrandLogo brand={botModelBrand({ providerId: usage.model.modelProvider, modelId: usage.model.modelId })} />
              </ItemMedia>
              <ItemContent>
                <ItemTitle numberOfLines={1}>{model?.name ?? usage.model.modelId}</ItemTitle>
                <ItemDescription>{provider?.name ?? usage.model.modelProvider}</ItemDescription>
                <ItemDescription>{m.settings_models_usage({ primary: usage.primary.length, fallbacks: usage.fallbacks.length })}</ItemDescription>
              </ItemContent>
              <Button
                accessibilityLabel={m.settings_models_replace_label({ model: model?.name ?? usage.model.modelId })}
                size="sm"
                variant="outline"
                onPress={() => router.push({ pathname: '/settings/models/swap', params: usage.model })}
              >
                {m.settings_models_replace()}
              </Button>
            </Item>
          );
        })}
      </ItemGroup>
    </BotDetailsSection>
  );
}
