import { botModelBrand, botModelUsage } from '@repo/client/client';
import { m } from '@repo/i18n/client';
import { BotBrandLogo } from '@repo/ui/bots/bot-brand-logo';
import { Button } from '@repo/ui/button';
import { Empty, EmptyDescription } from '@repo/ui/empty';
import { FormErrors } from '@repo/ui/forms/form';
import { PanelContent, PanelDescription, PanelRow, PanelTitle } from '@repo/ui/panel';
import { SettingsPanel } from '@repo/ui/settings/settings-panel';
import { Skeleton } from '@repo/ui/skeleton';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { SettingsModelSwap } from '@/components/settings/settings-model-swap';
import { rpc } from '@/services/rpc/rpc.client';
import IconCpu from '~icons/lucide/cpu';
import type { BotModelUsage } from '@repo/client/client';

export function SettingsModels() {
  const bots = useQuery(rpc.bots.list.queryOptions());
  const catalog = useQuery({ ...rpc.models.list.queryOptions(), retry: false });
  const providers = useQuery({ ...rpc.providers.list.queryOptions(), retry: false });
  const [selected, setSelected] = useState<BotModelUsage | null>(null);
  const models = botModelUsage({ bots: bots.data ?? [] });

  return (
    <>
      <SettingsPanel
        icon={IconCpu}
        id="models"
        title={m.settings_models_title()}
      >
        {bots.isPending ? <PanelRow><Skeleton className="h-10 w-full" /></PanelRow> : null}
        {bots.isError ? <PanelRow><FormErrors error={m.settings_models_load_error()} /></PanelRow> : null}
        {bots.isSuccess && models.size === 0 ? <Empty size="sm"><EmptyDescription>{m.settings_models_empty()}</EmptyDescription></Empty> : null}
        {[...models].map(([key, usage]) => {
          const provider = providers.data?.providers.find((item) => item.id === usage.model.modelProvider);
          const model = catalog.data?.find((item) => item.provider === usage.model.modelProvider && item.id === usage.model.modelId);

          return (
            <PanelRow key={key}>
              <BotBrandLogo brand={botModelBrand({ providerId: usage.model.modelProvider, modelId: usage.model.modelId })} />
              <PanelContent>
                <PanelTitle className="truncate">{model?.name ?? usage.model.modelId}</PanelTitle>
                <PanelDescription>{provider?.name ?? usage.model.modelProvider}</PanelDescription>
                <PanelDescription>{m.settings_models_usage({ primary: usage.primary.length, fallbacks: usage.fallbacks.length })}</PanelDescription>
              </PanelContent>
              <Button
                aria-label={m.settings_models_replace_label({ model: model?.name ?? usage.model.modelId })}
                size="sm"
                variant="outline"
                onClick={() => setSelected(usage)}
              >
                {m.settings_models_replace()}
              </Button>
            </PanelRow>
          );
        })}
      </SettingsPanel>
      {selected ? <SettingsModelSwap usage={selected} onClose={() => setSelected(null)} /> : null}
    </>
  );
}
